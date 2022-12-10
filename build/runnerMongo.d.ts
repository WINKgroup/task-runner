import { ITaskPersisted, TaskRunnerMongoOptions } from "./common";
import { ITaskDoc, ITaskModel } from "./modelTaskPersisted";
import TaskRunnerAbstract from "./runnerAbstract";
export default class TaskRunnerMongo extends TaskRunnerAbstract {
    dbUri: string;
    collection: string;
    constructor(dbUri: string, inputOptions?: TaskRunnerMongoOptions);
    getModel(): ITaskModel;
    protected doc2persisted(doc: ITaskDoc): ITaskPersisted;
    erase(withS?: boolean): Promise<void>;
    loadTasks(tasksToLoad: number): Promise<ITaskPersisted[]>;
    saveTask(persistedTask: ITaskPersisted): Promise<ITaskPersisted>;
    deleteTasksMarked(): Promise<void>;
}
