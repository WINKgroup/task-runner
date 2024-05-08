export const clientAddressableAttributes = [
    'id',
    'versionedTopic',
    'data',
    'priority',
];
export type TaskSignal = 'pause' | 'stop' | 'resume';

export interface TaskActions {
    stop?: () => Promise<boolean>;
    pause?: () => Promise<boolean>;
    resume?: () => Promise<boolean>;
}

export interface TaskActionAvailability {
    stop: boolean;
    pause: boolean;
    resume: boolean;
}

export interface SerializedTask {
    id: string;
    versionedTopic: string;
    state: 'to do' | 'running' | 'paused' | 'completed';
    data?: any;
    response?: any;
    deleteAt?: string;
    waitUntil?: string;
    availableActions: TaskActionAvailability;
}

export interface IPersistedTaskSpecificAttributes {
    priority?: number;
    applicant?: string;
    worker?: string;
    createdAt: string;
    updatedAt: string;
    availableActions: TaskActionAvailability;
    publicUrl?: string;
}

export interface InputTask
    extends Partial<Omit<SerializedTask, 'availableActions'>> {}

export interface IPersistedTask
    extends IPersistedTaskSpecificAttributes,
        Omit<SerializedTask, 'id'> {}

export interface PersistedTaskWithId extends IPersistedTask {
    id: string;
}

export interface TaskResponseError {
    state: 'error';
    error: string;
}

export interface TaskResponseSuccess<T> {
    state: 'success';
    result: T;
}

export type TaskResponse<T> = TaskResponseSuccess<T> | TaskResponseError;
