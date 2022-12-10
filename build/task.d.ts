/// <reference types="node" />
import ConsoleLog from "@winkgroup/console-log";
import { InputTask, ITaskPersisted } from "./common";
import { EventEmitter } from 'node:events';
export default abstract class Task extends EventEmitter {
    protected running: boolean;
    protected _id: any;
    protected _state: 'to do' | 'completed';
    protected _topic: string;
    data: any;
    protected _response: any;
    priority: number;
    applicant?: string;
    worker?: string;
    createdAt: string;
    deleteAt?: string;
    waitUntil?: string;
    consoleLog: ConsoleLog;
    constructor(inputOptions?: InputTask);
    get id(): any;
    get state(): "completed" | "to do";
    get topic(): string;
    get isRunning(): boolean;
    get response(): any;
    protected abstract _run(): Promise<void>;
    run(): Promise<void>;
    unpersistHelper(taskPersisted: ITaskPersisted): void;
    title(): string;
    setCompleted(millisecondsForDeletion?: number): void;
}
