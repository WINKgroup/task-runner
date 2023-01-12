import { v1 as uuid } from 'uuid';

export interface IPersistedTaskSpecificAttributes {
    id: string;
    versionedTopic: string;
    priority?: number;
    applicant?: string;
    worker?: string;
    createdAt: string;
    updatedAt: string;
}

export interface InputTask {
    state: 'to do' | 'completed';
    data?: any;
    response?: any;
    deleteAt?: string;
    waitUntil?: string;
}

export interface IPersistedTask
    extends IPersistedTaskSpecificAttributes,
        InputTask {}

export function getEmptyPersistedTask() {
    const persistedTask: IPersistedTask = {
        id: uuid(),
        versionedTopic: 'default#1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        state: 'to do',
    };

    return persistedTask;
}

export type TaskSignal = 'pause' | 'stop' | 'resume';

export interface TaskRunnerFindTasksParams {
    queryObj: object;
    limit: number;
    skip: number;
    sort: string;
}

export interface TaskRunnerRunPersistedTaskOptions {
    lockTask: boolean;
    forceRunning: boolean; // even if it in "completed" state
}
