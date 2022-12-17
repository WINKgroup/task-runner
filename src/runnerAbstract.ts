import { ITaskPersisted, persistedTaskTitle, TaskRunnerFindTasksParams, TaskRunnerOptions } from "./common"
import _ from 'lodash'
import ConsoleLog from "@winkgroup/console-log"
import Task from "./task"
import TaskFactory from "./factory"
import Cron from "@winkgroup/cron"

export default abstract class TaskRunnerAbstract {
    consoleLog = new ConsoleLog({prefix: 'Task Runner'})
    protected isActive = true
    protected _numOfRunningTasks = 0
    topicFactory = {} as {[topic:string]: TaskFactory}
    maxRunningTasks: number
    instance: string
    cronObj:Cron

    constructor(inputOptions?:Partial<TaskRunnerOptions>) {
        const options = _.defaults(inputOptions, {
            maxRunningTasks: 5,
            cronHz: 0,
            instance: 'default'
        })

        this.maxRunningTasks = options.maxRunningTasks
        this.instance = options.instance
        this.cronObj = new Cron(options.cronHz, this.consoleLog)
    }

    get active() { return this.isActive }
    set active(isActive:boolean) {
        if (isActive && !this.isActive) this.run()
        this.isActive = isActive
    }

    get numOfRunningTasks() { return this._numOfRunningTasks }

    abstract findTasks(params: Partial<TaskRunnerFindTasksParams>): Promise<ITaskPersisted[]>
    abstract loadTasks(tasksToLoad:number): Promise<ITaskPersisted[]>
    abstract saveTask(persistedTask:ITaskPersisted): Promise<ITaskPersisted | null>
    abstract getById(id:string): Promise<ITaskPersisted | null>
    abstract deleteById(id:string): Promise<void>
    abstract erase(): Promise<void>
    abstract deleteTasksMarked(): Promise<void>

    protected loadTasksQueryObj() {
        const topics = Object.keys(this.topicFactory)
        const now = (new Date()).toISOString()
        const queryObj:{[key:string]: any} = { 
            state: 'to do',
            worker: {$exists: false},
            $or: [
                { waitUntil: {$exists: false} },
                { waitUntil: {$lte: now} }
            ]
        }
        
        if (topics.indexOf('') !== -1) {
            if(topics.length > 1) throw new Error('topic empty should be used alone')
            queryObj['topic'] = {$exists: false}
        } else {
            queryObj['topic'] = {$in: topics}
        }

        return queryObj
    }

    getFactory(topic?:string) {
        try {
            if (!topic) {
                const topicFactoryList = Object.values(this.topicFactory)
                if (topicFactoryList.length === 0) throw new Error('no topic factory registered')
                return topicFactoryList[0]
            } else {
                const factory = this.topicFactory[ topic ]
                if (!factory) throw new Error(`no factory registered for topic "${ topic }"`)
                return factory
            }
        } catch (e) {
            this.consoleLog.error(e as string)
            return null
        }
    }

    unpersistTask(persistedTask:ITaskPersisted) {
        const factory = this.getFactory(persistedTask.topic)
        return factory ? factory.unpersist(persistedTask) : null
    }

    async persistTask(task:Task, save = true) {
        const factory = this.getFactory(task.topic)
        if (!factory) throw new Error(`unable to save task ${ task.title() }`)
        const persistedTask = factory.persist(task)
        if (!save) return persistedTask
        const result = await this.saveTask(persistedTask)
        return result
    }

    async lockTask(persistedTask:ITaskPersisted) {
        persistedTask.worker = this.instance
        const result = await this.saveTask(persistedTask)
        return !!result
    }

    protected async retrieveTasksAndLock(tasksToStart:number) {
        const tasks = [] as Task[]
        if (tasksToStart <= 0) return []
        const persistedTasks = await this.loadTasks(tasksToStart)
        for(const persistedTask of persistedTasks) {
            const task = this.unpersistTask( persistedTask )
            if (!task) continue
            const locked = await this.lockTask(persistedTask)
            if (!locked) {
                this.consoleLog.debug(`unable to lock task ${ persistedTaskTitle(persistedTask) }`)
                continue
            } else this.consoleLog.debug(`task ${ persistedTaskTitle(persistedTask) } locked`)
            tasks.push(task)
        }

        return tasks
    }

    protected runTask(task:Task) {
        ++this._numOfRunningTasks
        this.consoleLog.debug(`running task ${ task.title() }`)
        task.addListener('ended', async () => {
            --this._numOfRunningTasks
            task.worker = undefined
            this.consoleLog.debug(`unlocking task ${ task.title() }`)
            const result = await this.persistTask(task)
            if (!result) this.consoleLog.error(`unable to persist task ${ task.title() }`)
        } )
        return task.run()
    }

    async run() {
        if (!this.isActive) {
            this.consoleLog.debug('not active, run aborted')
            return
        }
        const numOfFactories = Object.values(this.topicFactory).length
        if (numOfFactories === 0) this.consoleLog.warn('no factory registered, likely no task will be run')
        const tasksToStart = this.maxRunningTasks - this._numOfRunningTasks
        this.consoleLog.debug(`running tasks ${ this._numOfRunningTasks }/${ this.maxRunningTasks }`)
        const tasks = await this.retrieveTasksAndLock(tasksToStart)
        tasks.map( task => this.runTask(task) )
    }

    async cron() {
        if (!this.cronObj.tryStartRun()) return
        await this.run()
        await this.deleteTasksMarked()
        this.cronObj.runCompleted()
    }
}