import { ITaskPersisted, TaskRunnerFindTasksParams, TaskRunnerOptions } from "./common";
import ConsoleLog from "@winkgroup/console-log";
import Task from "./task";
import TaskFactory from "./factory";
import Cron from "@winkgroup/cron";
export default abstract class TaskRunnerAbstract {
    consoleLog: ConsoleLog;
    protected isActive: boolean;
    protected _numOfRunningTasks: number;
    topicFactory: {
        [topic: string]: TaskFactory;
    };
    maxRunningTasks: number;
    instance: string;
    cronObj: Cron;
    constructor(inputOptions?: Partial<TaskRunnerOptions>);
    get active(): boolean;
    set active(isActive: boolean);
    get numOfRunningTasks(): number;
    abstract findTasks(params: Partial<TaskRunnerFindTasksParams>): Promise<ITaskPersisted[]>;
    abstract loadTasks(tasksToLoad: number): Promise<ITaskPersisted[]>;
    abstract saveTask(persistedTask: ITaskPersisted): Promise<ITaskPersisted | null>;
    abstract getById(id: string): Promise<ITaskPersisted | null>;
    abstract deleteById(id: string): Promise<void>;
    abstract erase(): Promise<void>;
    abstract deleteTasksMarked(): Promise<void>;
    protected loadTasksQueryObj(): {
        [key: string]: any;
    };
    registerFactory(topic: string, factory: TaskFactory): void;
    getFactory(topic?: string): TaskFactory | null;
    unpersistTask(persistedTask: ITaskPersisted): Task | null;
    persistTask(task: Task, save?: boolean): Promise<ITaskPersisted | null>;
    lockTask(persistedTask: ITaskPersisted): Promise<boolean>;
    protected retrieveTasksAndLock(tasksToStart: number): Promise<Task[]>;
    protected runTask(task: Task): Promise<void>;
    run(): Promise<void>;
    cron(): Promise<void>;
    shutdown(): Promise<void>;
}
