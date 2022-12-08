import { ITaskPersisted, TaskRunnerOptions } from "./common";
import ConsoleLog from "@winkgroup/console-log";
import Task from "./task";
import TaskFactory from "./factory";
export default abstract class TaskRunnerAbstract {
    options: TaskRunnerOptions;
    consoleLog: ConsoleLog;
    protected isActive: boolean;
    protected _numOfRunningTasks: number;
    topicFactory: {
        [topic: string]: TaskFactory;
    };
    constructor(inputOptions?: Partial<TaskRunnerOptions>);
    get active(): boolean;
    set active(isActive: boolean);
    get numOfRunningTasks(): number;
    protected abstract loadTasks(tasksToLoad: number): Promise<ITaskPersisted[]>;
    abstract erase(): Promise<void>;
    abstract upsertTask(taskPersisted: ITaskPersisted): Promise<ITaskPersisted>;
    getFactory(topic?: string): TaskFactory | null;
    unpersistTask(persistedTask: ITaskPersisted): Task | null;
    persistTask(task: Task): ITaskPersisted | null;
    run(): Promise<void>;
}
