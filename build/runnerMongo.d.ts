import { IPersistedTask, TaskRunnerFindTasksParams } from "./common";
import { ITaskModel } from "./modelTaskPersisted";
import TaskRunnerAbstract, { TaskRunnerOptions } from "./runnerAbstract";
export interface TaskRunnerMongoOptions extends TaskRunnerOptions {
    collection: string;
}
export default class TaskRunnerMongo extends TaskRunnerAbstract {
    dbUri: string;
    collection: string;
    constructor(dbUri: string, inputOptions?: Partial<TaskRunnerMongoOptions>);
    getModel(): ITaskModel;
    erase(withS?: boolean): Promise<void>;
    getPersistedTaskById(persistedId: string): Promise<IPersistedTask | null>;
    deletePersistedTaskById(persistedId: string): Promise<void>;
    findPersistedTasks(inputParams: Partial<TaskRunnerFindTasksParams>): Promise<IPersistedTask[]>;
    loadTasks(tasksToLoad: number): Promise<IPersistedTask[]>;
    savePersistedTask(persistedTask: IPersistedTask): Promise<boolean>;
    deletePersistedTasksMarked(): Promise<void>;
}
