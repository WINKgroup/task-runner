import { IPersistedTask } from "./common";
import Task from "./task";
export default abstract class TaskFactory {
    abstract unpersist(taskPersisted: IPersistedTask): Task;
}
