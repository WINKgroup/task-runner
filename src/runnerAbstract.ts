import { ITaskPersisted, TaskRunnerOptions } from "./common"
import _ from 'lodash'
import ConsoleLog from "@winkgroup/console-log"
import Task from "./task"
import TaskFactory from "./factory"

export default abstract class TaskRunnerAbstract {
    options:TaskRunnerOptions
    consoleLog = new ConsoleLog({prefix: 'Task Runner'})
    protected isActive = true
    protected _numOfRunningTasks = 0
    topicFactory = {} as {[topic:string]: TaskFactory}

    constructor(inputOptions?:Partial<TaskRunnerOptions>) {
        this.options = _.defaults(inputOptions, {
            maxRunningTasks: 5,
            cronHz: 0
        })
    }

    get active() { return this.isActive }
    set active(isActive:boolean) {
        if (isActive && !this.isActive) this.run()
        this.isActive = isActive
    }

    get numOfRunningTasks() { return this._numOfRunningTasks }

    protected abstract loadTasks(tasksToLoad:number): Promise<ITaskPersisted[]>
    abstract erase(): Promise<void>
    abstract upsertTask(taskPersisted: ITaskPersisted): Promise<ITaskPersisted>

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

    persistTask(task:Task) {
        const factory = this.getFactory(task.topic)
        return factory ? factory.persist(task) : null
    }

    async run() {
        if (!this.isActive) {
            this.consoleLog.debug('not active, run aborted')
            return
        }
        const tasksToStart = this.options.maxRunningTasks - this._numOfRunningTasks
        this.consoleLog.debug(`running tasks ${ this._numOfRunningTasks }/${ this.options.maxRunningTasks }`)
        if (tasksToStart > 0) {
            const persistedTasks = await this.loadTasks(tasksToStart)
            const tasks = persistedTasks.map(persistedTask => this.unpersistTask( persistedTask ) )
            tasks.map( task => {
                if (task) {
                    ++this._numOfRunningTasks
                    task.addListener('ended', () => {
                        --this._numOfRunningTasks
                        this.persistTask(task)
                    } )
                    task.run()
                }
            })
        }
    }
}