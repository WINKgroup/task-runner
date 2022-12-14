export interface TaskRunnerOptions {
    maxRunningTasks: number;
    cronHz: number;
    instance: string;
}
export interface TaskRunnerMongoOptions extends TaskRunnerOptions {
    collection: string;
}
export interface ITaskPersisted {
    idTask: any;
    state: 'to do' | 'completed';
    topic?: string;
    data?: any;
    response?: any;
    priority?: number;
    applicant?: string;
    worker?: string;
    createdAt: string;
    updatedAt: string;
    deleteAt?: string;
    waitUntil?: string;
}
export declare function persistedTaskTitle(persistedTask: ITaskPersisted): string;
export interface InputTask extends Omit<ITaskPersisted, 'idTask' | 'updatedAt'> {
    id?: any;
}
export declare function getEmptyInputTask(): void;
export declare function getEmptyTaskPersisted(): ITaskPersisted;
export type TaskSignal = 'pause' | 'stop' | 'resume';
export interface TaskRunnerFindTasksParams {
    queryObj: object;
    limit: number;
    skip: number;
    sort: string;
}
