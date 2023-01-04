/// <reference types="node" />
import ConsoleLog from "@winkgroup/console-log";
import { EventEmitter } from 'node:events';
import { InputTask, IPersistedTask, IPersistedTaskSpecificAttributes } from "./common";
export default abstract class Task extends EventEmitter {
    protected _state: 'to do' | 'completed';
    data?: any;
    protected _response?: any;
    protected deleteAt?: string;
    protected waitUntil?: string;
    protected _running: boolean;
    consoleLog: ConsoleLog;
    constructor(inputOptions?: InputTask);
    get state(): "completed" | "to do";
    get running(): boolean;
    get response(): any;
    protected abstract _run(): Promise<void>;
    protected abstract _stop?(): Promise<void>;
    protected abstract _pause?(): Promise<void>;
    protected abstract _resume?(): Promise<void>;
    protected abstract _recover?(): Promise<void>;
    run(): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    recover(): Promise<void>;
    persist(topic: string, inputOptions?: Omit<Partial<IPersistedTaskSpecificAttributes>, 'topic'>): IPersistedTask;
    /**
     * you should use an instance of TaskFactory to perform unpersist
     *
     */
    _unpersistHelperForTaskFactory(taskPersisted: IPersistedTask): void;
    setCompleted(millisecondsForDeletion?: number): void;
}
