/// <reference types="node" />
import ConsoleLog from "@winkgroup/console-log";
import Cron from "@winkgroup/cron";
import { EventEmitter } from 'node:events';
import { Namespace } from 'socket.io';
import { IPersistedTask, IPersistedTaskSpecificAttributes, TaskRunnerFindTasksParams } from "./common";
import TaskFactory from "./factory";
import Task from "./task";
export interface TaskRunnerOptions {
    instance: string;
    everySeconds: number;
    topicFactories: {
        [topic: string]: TaskFactory;
    };
    maxRunningTasks: number;
    startActive: boolean;
    consoleLog: ConsoleLog;
    ioNamespace: Namespace;
    housekeeperEverySeconds: number;
}
export default abstract class TaskRunnerAbstract extends EventEmitter {
    instance: string;
    cronObj: Cron;
    topicFactory: {
        [topic: string]: TaskFactory;
    };
    maxRunningTasks: number;
    consoleLog: ConsoleLog;
    io?: Namespace;
    protected _active: boolean;
    protected _setup: boolean;
    protected _persistedTasks: {
        [key: string]: IPersistedTask;
    };
    houseKeeperCronObj: Cron;
    constructor(inputOptions?: Partial<TaskRunnerOptions>);
    get active(): boolean;
    get list(): IPersistedTask[];
    get taskIds(): string[];
    get numOfRunningTasks(): number;
    abstract findPersistedTasks(params: Partial<TaskRunnerFindTasksParams>): Promise<IPersistedTask[]>;
    abstract savePersistedTask(persistedTask: IPersistedTask): Promise<boolean>;
    abstract getPersistedTaskById(persistedId: string): Promise<IPersistedTask | null>;
    abstract deletePersistedTaskById(persistedId: string): Promise<void>;
    abstract erase(): Promise<void>;
    abstract deletePersistedTasksMarked(): Promise<void>;
    protected abstract loadTasks(numOfTasksToLoad: number): Promise<IPersistedTask[]>;
    start(): void;
    stop(force?: boolean): Promise<void>;
    protected loadTasksQueryObj(): {
        [key: string]: any;
    };
    registerFactory(factory: TaskFactory, topic?: string): void;
    getFactory(topic?: string): TaskFactory;
    unpersistTask(persistedTask: IPersistedTask): Task;
    persistTask(task: Task, topic: string, inputOptions?: Omit<Partial<IPersistedTaskSpecificAttributes>, 'topic'>, save?: boolean): Promise<IPersistedTask>;
    lockPersistedTask(persistedTask: IPersistedTask): Promise<boolean>;
    protected retrieveTasksAndLock(tasksToStart: number): Promise<IPersistedTask[]>;
    protected runPersistedTaskAndUnlock(persistedTask: IPersistedTask): Promise<void>;
    run(): Promise<void>;
    cron(): Promise<void>;
    isIoTokenValid(token: string): boolean;
    setIo(): void;
}
