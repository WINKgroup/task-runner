import { ITaskPersisted } from "./common"
import Task from "./task"

export default abstract class TaskFactory {
    abstract unpersist(taskPersisted: ITaskPersisted): Task
    
    persist(task: Task) {
        const taskPersisted:ITaskPersisted = {
            idTask: task.id,
            state: task.state,
            createdAt: task.createdAt,
            updatedAt: (new Date()).toISOString()
        }

        if (task.topic) taskPersisted.topic = task.topic
        if (task.data) taskPersisted.data = task.data
        if (task.response) taskPersisted.response = task.response
        if (task.priority) taskPersisted.priority = task.priority
        if (task.applicant) taskPersisted.applicant = task.applicant
        if (task.worker) taskPersisted.worker = task.worker
        if (task.waitUntil) taskPersisted.waitUntil = task.waitUntil

        return taskPersisted
    }
}