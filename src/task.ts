import ConsoleLog from '@winkgroup/console-log';
import Cron from '@winkgroup/cron';
import _ from 'lodash';
import { EventEmitter } from 'node:events';
import {
    InputTask,
    IPersistedTask,
    IPersistedTaskSpecificAttributes,
} from './common';
import { v1 as uuid } from 'uuid';

export default abstract class Task extends EventEmitter {
    protected _state: 'to do' | 'completed';
    data?: any;
    protected _response?: any;
    protected deleteAt?: string;
    protected waitUntil?: string;

    protected _running = false;
    consoleLog: ConsoleLog;

    constructor(inputOptions?: InputTask) {
        super();
        const options = _.defaults(inputOptions, { state: 'to do' });
        this._state = options.state;
        this.data = options.data;
        this._response = options.response;
        this.deleteAt = options.deleteAt;
        this.waitUntil = options.waitUntil;

        this.consoleLog = new ConsoleLog({ prefix: 'Task' });
    }

    get state() {
        return this._state;
    }
    get running() {
        return this._running;
    }
    get response() {
        return this._response;
    }

    protected abstract _run(): Promise<void>;
    protected abstract _stop?(): Promise<void>;
    protected abstract _pause?(): Promise<void>;
    protected abstract _resume?(): Promise<void>;
    protected abstract _recover?(): Promise<void>;

    async run() {
        if (this._running) {
            this.consoleLog.warn('already running');
            return;
        }
        this._running = true;
        this._response = undefined;
        this.emit('started');
        await this._run();
        this.emit('ended', this._response);
        this._running = false;
    }

    async stop() {
        if (this._running) {
            if (!this._stop) throw new Error('stop not implemented');
            await this._stop();
        }
        this.emit('stopped', this._response);
    }

    async pause() {
        if (!this._pause) throw new Error('pause not implemented');
        await this._pause();
        this.emit('paused', this._response);
    }

    async resume() {
        if (!this._resume) throw new Error('resume not implemented');
        await this._resume();
        this.emit('resumed', this._response);
    }

    async recover() {
        if (!this._recover) throw new Error('recover not implemented');
        await this._recover();
        this.emit('recovered', this._response);
    }

    persist(
        topic: string,
        inputOptions?: Omit<Partial<IPersistedTaskSpecificAttributes>, 'topic'>
    ) {
        const options = _.defaults(inputOptions, {
            persistedId: uuid(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const persistedTask: IPersistedTask = {
            ...options,
            state: this._state,
            topic: topic,
            data: this.data,
            response: this._response,
            deleteAt: this.deleteAt,
            waitUntil: this.waitUntil,
        };

        return persistedTask;
    }

    /**
     * you should use an instance of TaskFactory to perform unpersist
     *
     */
    _unpersistHelperForTaskFactory(taskPersisted: IPersistedTask) {
        this._state = taskPersisted.state;
        this.data = taskPersisted.data;
        this._response = taskPersisted.response;
        this.deleteAt = taskPersisted.deleteAt;
        this.waitUntil = taskPersisted.waitUntil;
    }

    setCompleted(millisecondsForDeletion = 30000) {
        this._state = 'completed';
        this.deleteAt = Cron.comeBackIn(millisecondsForDeletion);
    }
}
