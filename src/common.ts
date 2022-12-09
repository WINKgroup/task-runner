export interface TaskRunnerOptions {
    maxRunningTasks:number
    cronHz:number
    instance:string
}

export interface TaskRunnerMongoOptions extends TaskRunnerOptions {
    collection: string
}

export interface ITaskPersisted {
    idTask: any
    state: 'to do' | 'completed'
    topic?: string
    data?: any
    response?: any
    priority?: number
    applicant?: string
    worker?: string
    createdAt: string
    updatedAt: string
    deleteAt?: string
    waitUntil?: string
}

export function persistedTaskTitle(persistedTask: ITaskPersisted) {
    let title = persistedTask.topic ? persistedTask.topic : ''
    title += ` (${ persistedTask.idTask })`

    return title
}

export interface InputTask extends Omit<ITaskPersisted, 'idTask' | 'updatedAt' > {
    id?: any
}

export type TaskSignal = 'pause' | 'stop' | 'resume'