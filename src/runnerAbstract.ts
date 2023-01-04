import ConsoleLog from "@winkgroup/console-log"
import Cron from "@winkgroup/cron"
import _ from 'lodash'
import { EventEmitter } from 'node:events'
import { Namespace } from 'socket.io'
import { IPersistedTask, IPersistedTaskSpecificAttributes, TaskRunnerFindTasksParams } from "./common"
import TaskFactory from "./factory"
import Task from "./task"

export interface TaskRunnerOptions {
    instance:string
    everySeconds:number
    topicFactories: {[topic:string]: TaskFactory}
    maxRunningTasks:number
    startActive: boolean
    consoleLog:ConsoleLog
    ioNamespace: Namespace
    housekeeperEverySeconds:number
}

export default abstract class TaskRunnerAbstract extends EventEmitter {
    instance: string
    cronObj:Cron
    topicFactory = {} as {[topic:string]: TaskFactory}
    maxRunningTasks: number
    consoleLog:ConsoleLog
    io?:Namespace
    
    protected _active:boolean
    protected _setup = false
    protected _persistedTasks = {} as {[key: string]: IPersistedTask}
    houseKeeperCronObj:Cron
    
    constructor(inputOptions?:Partial<TaskRunnerOptions>) {
        super()
        const options = _.defaults(inputOptions, {
            instance: 'default',
            everySeconds: 0,
            maxRunningTasks: 5,
            startActive: true,
            consoleLog: new ConsoleLog({prefix: 'Task Runner'}),
            housekeeperEverySeconds: 10 * 60
        })

        this.instance = options.instance
        this.cronObj = new Cron(options.everySeconds, options.consoleLog)
        this.maxRunningTasks = options.maxRunningTasks
        this._active = options.startActive
        this.consoleLog = options.consoleLog
        this.io = options.ioNamespace
        this.houseKeeperCronObj = new Cron(options.housekeeperEverySeconds, options.consoleLog)

        this.setIo()
    }

    get active() { return this._active }

    get list() { return Object.values(this._persistedTasks) }
    get taskIds() { return Object.keys(this._persistedTasks) }
    get numOfRunningTasks() { return Object.keys(this._persistedTasks).length }

    abstract findPersistedTasks(params: Partial<TaskRunnerFindTasksParams>): Promise<IPersistedTask[]>
    abstract savePersistedTask(persistedTask:IPersistedTask): Promise<boolean>
    abstract getPersistedTaskById(persistedId:string): Promise<IPersistedTask | null>
    abstract deletePersistedTaskById(persistedId:string): Promise<void>
    abstract erase(): Promise<void>
    abstract deletePersistedTasksMarked(): Promise<void>
    protected abstract loadTasks(numOfTasksToLoad:number): Promise<IPersistedTask[]>

    start() {
        const needsRun = !this._active
        this._active = true
        if (needsRun) this.run()
    }

    async stop(force = false) {
        if (!this._active) return
        this._active = false
        await Promise.all(
            this.list.map( persistedTask => {
                const task = this.unpersistTask(persistedTask)
                if (force && task.stop) {
                    return task.stop()
                } else {
                    if (force) this.consoleLog.warn(`unable to perform "force" option since task ${ persistedTask.persistedId } has no stop method`)
                    const waitForEnd = () => new Promise<void>( resolve => {
                        task.on('ended', resolve)
                    })
                    return waitForEnd
                }
            } )
        )
    }

    protected loadTasksQueryObj() {
        const topics = Object.keys(this.topicFactory)
        const now = (new Date()).toISOString()
        const queryObj:{[key:string]: any} = { 
            state: 'to do',
            topic: {$in: topics},
            worker: {$exists: false},
            $or: [
                { waitUntil: {$exists: false} },
                { waitUntil: {$lte: now} }
            ]
        }
        
        return queryObj
    }

    registerFactory(factory:TaskFactory, topic = 'default') {
        this.topicFactory[topic] = factory
        this.consoleLog.print(`new factory registered for topic "${ topic }"`)
    }

    getFactory(topic = 'default') {
        const factory = this.topicFactory[ topic ]
        if (!factory) throw new Error(`no factory registered for topic "${ topic }"`)
        return factory
    }

    unpersistTask(persistedTask:IPersistedTask) {
        const factory = this.getFactory(persistedTask.topic)
        return factory.unpersist(persistedTask)
    }

    async persistTask(task:Task, topic: string, inputOptions?:Omit<Partial<IPersistedTaskSpecificAttributes>, 'topic'>, save = false) {
        const options = _.defaults(inputOptions, { applicant: this.instance })
        const persistedTask = task.persist(topic, options)

        if (save) await this.savePersistedTask(persistedTask)
        return persistedTask
    }

    async lockPersistedTask(persistedTask:IPersistedTask) {
        persistedTask.worker = this.instance
        return this.savePersistedTask(persistedTask)
    }

    protected async retrieveTasksAndLock(tasksToStart:number) {
        if (tasksToStart <= 0) return []
        const persistedTasks = await this.loadTasks(tasksToStart)
        for(const persistedTask of persistedTasks) {
            const isLocked = await this.lockPersistedTask(persistedTask)
            if (!isLocked) {
                this.consoleLog.debug(`unable to lock task ${ persistedTask.persistedId }`)
                continue
            } else this.consoleLog.debug(`task ${ persistedTask.persistedId } locked`)
            persistedTasks.push(persistedTask)
        }

        return persistedTasks
    }

    protected async runPersistedTaskAndUnlock(persistedTask:IPersistedTask) {
        this._persistedTasks[persistedTask.persistedId] = persistedTask
        this.consoleLog.debug(`running task ${ persistedTask.persistedId }...`)
        const task = this.unpersistTask(persistedTask)
        await task.run()
        persistedTask = task.persist(persistedTask.topic, {
            persistedId: persistedTask.persistedId,
            createdAt: persistedTask.createdAt,
            applicant: persistedTask.applicant
        })
        delete persistedTask.worker
        await this.savePersistedTask(persistedTask)
    }

    async run() {
        if (!this._active) {
            this.consoleLog.debug('not active, run aborted')
            return
        }
        const numOfFactories = Object.values(this.topicFactory).length
        if (numOfFactories === 0) this.consoleLog.warn('no factory registered, likely no task will be run')
        const tasksToStart = this.maxRunningTasks - this.numOfRunningTasks
        this.consoleLog.debug(`running tasks ${ this.numOfRunningTasks }/${ this.maxRunningTasks }`)
        const persistedTasks = await this.retrieveTasksAndLock(tasksToStart)
        persistedTasks.map( persistedTask => this.runPersistedTaskAndUnlock(persistedTask) )
    }

    async cron() {
        if (this.cronObj.tryStartRun()) {
            await this.run()
            this.cronObj.runCompleted()
        }
        
        if (this.houseKeeperCronObj.tryStartRun()) {
            await this.deletePersistedTasksMarked()
            this.houseKeeperCronObj.runCompleted()
        }
    }

    isIoTokenValid(token:string) {
        return true
    }

    setIo() {
        if (!this.io) return

        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token
            if (!this.isIoTokenValid(token)) next( new Error('access denied'))
                else next()
        })

        this.io.on('connection', (socket) => {
            this.consoleLog.debug('client connected')
            socket.on('start', () => { this._active = true })
            socket.on('stop', (force?:boolean) => this.stop(force) )
        })
    }
}