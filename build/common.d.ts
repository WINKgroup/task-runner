export interface IPersistedTaskSpecificAttributes {
    persistedId: string;
    topic: string;
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
export interface IPersistedTask extends IPersistedTaskSpecificAttributes, InputTask {
}
export declare function getEmptyPersistedTask(): IPersistedTask;
export type TaskSignal = 'pause' | 'stop' | 'resume';
export interface TaskRunnerFindTasksParams {
    queryObj: object;
    limit: number;
    skip: number;
    sort: string;
}
export interface TaskRunnerRunPersistedTaskOptions {
    lockTask: boolean;
    forceRunning: boolean;
}
