import { IPersistedTask, PersistedTaskWithId } from './common';
import { TaskDoc } from './model';
import Task from './task';

export default abstract class TaskFactory {
    cronVersionedTopics = [] as string[];
    recover?: (taskDoc: TaskDoc) => Promise<boolean>;

    abstract unpersist(taskPersisted: PersistedTaskWithId): Task;

    validateClientAddressableAttributes(
        attributes: Partial<PersistedTaskWithId>,
    ) {
        const errors = [] as string[];
        return errors;
    }

    async createCronPersistedTasks(
        cronVersionedTopic: string,
    ): Promise<IPersistedTask[]> {
        throw new Error('not implemented');
    }
}
