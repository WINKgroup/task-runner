import Cron from "@winkgroup/cron"
import { ITaskPersisted } from "../src/common"
import TaskFactory from "../src/factory"
import Task from "../src/task"

export default class TimeoutTask extends Task {
    pause:  undefined
    timeoutObj?: NodeJS.Timeout
    resolve?:Function

    async stop() {
        this._response = 'stopped'
        this.waitUntil = Cron.comeBackIn(10000)
        if (this.timeoutObj) clearTimeout(this.timeoutObj)
        if (this.resolve) this.resolve()
        this.consoleLog.print('stopped')
        this.clearCallbacks()

    }

    protected clearCallbacks() {
        delete this.timeoutObj
        delete this.resolve
    }

    title() {
        return `task timeout after ${  } millisecs`
    }

    _run() {
        const data = this.data as number

        const task = this as TimeoutTask
        return new Promise<void>((resolve) => {
            task.consoleLog.print('started')
            this.resolve = resolve
            this.timeoutObj = setTimeout(() => {
                this.clearCallbacks()
                task.consoleLog.print('completed')
                task.setCompleted(10000)
                resolve()
            }, data)
        })
    }
}

export class TimeoutTaskFactory extends TaskFactory {
    unpersist(taskPersisted: ITaskPersisted) {
        const task = new TimeoutTask()
        task.unpersistHelper(taskPersisted)
        return task
    }
}