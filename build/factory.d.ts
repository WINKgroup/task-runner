import { ITaskPersisted } from "./common";
import Task from "./task";
export default abstract class TaskFactory {
    abstract unpersist(taskPersisted: ITaskPersisted): Task;
    persist(task: Task): ITaskPersisted;
    static emptyTaskPersisted(): ITaskPersisted;
}
