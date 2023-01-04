import { v1 as uuid } from 'uuid'

export interface IPersistedTaskSpecificAttributes {
    persistedId: string
    topic: string
    priority?: number
    applicant?: string
    worker?: string
    createdAt: string
    updatedAt: string
}

export interface InputTask {
    state: 'to do' | 'completed'
    data?: any
    response?: any
    deleteAt?: string
    waitUntil?: string
}

export interface IPersistedTask extends IPersistedTaskSpecificAttributes, InputTask {
}

export function getEmptyPersistedTask() {
    const persistedTask:IPersistedTask = {
        persistedId: uuid(),
        topic: 'default',
        createdAt: (new Date()).toISOString(),
        updatedAt: (new Date()).toISOString(),
        state: 'to do'
    }

    return persistedTask
}

export type TaskSignal = 'pause' | 'stop' | 'resume'

export interface TaskRunnerFindTasksParams {
    queryObj: object,
    limit: number,
    skip: number,
    sort: string
}