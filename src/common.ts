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

export function getEmptyInputTask() {
    const inputTask:InputTask = {
        state: 'to do',
        createdAt: (new Date()).toISOString()
    }

    return inputTask
}

export function getEmptyTaskPersisted() {
    const taskPersisted:ITaskPersisted = {
        idTask: undefined,
        state: 'to do',
        createdAt: (new Date()).toISOString(),
        updatedAt: (new Date()).toISOString()
    }

    return taskPersisted
}

export type TaskSignal = 'pause' | 'stop' | 'resume'

export interface TaskRunnerFindTasksParams {
    queryObj: object,
    limit: number,
    skip: number,
    sort: string
}