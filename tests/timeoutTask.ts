import { ITaskPersisted } from "../src/common"
import TaskFactory from "../src/factory"
import Task from "../src/task"

export default class TimeoutTask extends Task {
    _run() {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, 100)
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