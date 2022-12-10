import ConsoleLog from "@winkgroup/console-log"
import _ from "lodash"
import { InputTask, ITaskPersisted, TaskSignal } from "./common"
import { EventEmitter } from 'node:events'
import Cron from "@winkgroup/cron"

export default abstract class Task extends EventEmitter {
    protected running = false
    protected _id:any
    protected _state:'to do' | 'completed'
    protected _topic
    data: any
    protected _response = undefined as any
    priority: number
    applicant?: string
    worker?: string
    createdAt: string
    deleteAt?: string
    waitUntil?: string
    consoleLog = new ConsoleLog({prefix: 'Task'})

    constructor(inputOptions?:InputTask) {
        super()
        const options = _.defaults(inputOptions, {
            state: 'to do',
            topic: '',
            priority: 0,
            createdAt: (new Date()).toISOString()
        })
        this._id = options.id
        this._state = options.state
        this._topic = options.topic
        this.data = options.data
        this._response = options.response
        this.priority = options.priority
        this.applicant = options.applicant
        this.worker = options.worker
        this.createdAt = options.createdAt
        this.deleteAt = options.deleteAt
        this.waitUntil = options.waitUntil
    }

    get id() { return this._id }
    get state() { return this._state }
    get topic() { return this._topic }
    get isRunning() { return this.running }
    get response() { return this._response }

    protected abstract _run(): Promise<void>

    async run() {
        if (this.running) {
            this.consoleLog.warn('already running')
            return
        }
        this.running = true
        this._response = undefined
        this.emit('started')
        await this._run()
        this.emit('ended', this._response)
        this.running = false
    }

    unpersistHelper(taskPersisted: ITaskPersisted) {
        this._id = taskPersisted.idTask
        this._topic = taskPersisted.topic ? taskPersisted.topic : ''
        this.data = taskPersisted.data
        this._response = taskPersisted.response
        this.priority = taskPersisted.priority ? taskPersisted.priority : 0
        this.applicant = taskPersisted.applicant
        this.worker = taskPersisted.worker
        this.createdAt = taskPersisted.createdAt
        this.deleteAt = taskPersisted.deleteAt
        this.waitUntil = taskPersisted.waitUntil
    }

    title() {
        let title = this._topic
        if (this._id) title += ` (${ this._id })`

        return title
    }

    setCompleted(millisecondsForDeletion = 30000) {
        this._state = 'completed'
        this.deleteAt = Cron.comeBackIn(millisecondsForDeletion)
    }
}