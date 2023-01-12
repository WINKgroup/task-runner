import { IPersistedTask } from './common';
import Task from './task';

export default abstract class TaskFactory {
    cronVersionedTopics = [] as string[]

    abstract unpersist(taskPersisted: IPersistedTask): Task;
}
