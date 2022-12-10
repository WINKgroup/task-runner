import { ITaskPersisted } from "../src/common"
import TaskFactory from "../src/factory"
import Task from "../src/task"

export default class TimeoutTask extends Task {
    _run() {
        const task = this as TimeoutTask
        return new Promise<void>((resolve) => {
            task.consoleLog.print('started')
            setTimeout(() => {
                task.consoleLog.print('completed')
                task._response = 'done'
                task.setCompleted(10000)
                resolve()
            }, 100)
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