import ConsoleLog from '@winkgroup/console-log';
import Cron from '@winkgroup/cron';
import _ from 'lodash';
import {
    InputTask,
    IPersistedTask,
    IPersistedTaskSpecificAttributes,
    SerializedTask,
    TaskActionAvailability,
    TaskActions,
} from './common';
import { EventEmitter } from 'node:events';

export default abstract class Task extends EventEmitter {
    readonly id: string;
    readonly versionedTopic: string;
    protected _state: 'to do' | 'running' | 'paused' | 'completed';
    data?: any;
    protected _response?: any;
    protected deleteAt?: string;
    protected waitUntil?: string;

    consoleLog: ConsoleLog;

    protected _actions = {} as TaskActions;

    constructor(inputOptions?: InputTask) {
        super();
        const options = _.defaults(inputOptions, {
            id: '',
            versionedTopic: 'default#1',
            state: 'to do',
        });
        this.id = options.id;
        this.versionedTopic = options.versionedTopic;
        this._state = options.state;
        this.data = options.data;
        this._response = options.response;
        this.deleteAt = options.deleteAt;
        this.waitUntil = options.waitUntil;

        this.consoleLog = new ConsoleLog({
            prefix: `Task ${this.versionedTopic}`,
            id: this.id,
        });
    }

    get state() {
        return this._state;
    }
    get response() {
        return _.cloneDeep(this._response);
    }

    isProgressEmitter() {
        return false;
    }

    serialize() {
        const serialized: SerializedTask = {
            id: this.id,
            versionedTopic: this.versionedTopic,
            state: this._state,
            data: Task._serializeAny(this.data),
            response: Task._serializeAny(this._response),
            deleteAt: this.deleteAt,
            waitUntil: this.waitUntil,
            availableActions: this.getAvailableActions(),
        };

        return serialized;
    }

    protected abstract _run(): Promise<void>;

    async run() {
        switch (this._state) {
            case 'running':
                this.consoleLog.warn('already running');
                break;
            case 'to do':
                this._state = 'running';
                this._response = undefined;
                this.emit('updated');
                await this._run();
                this.emit('updated');
                break;
            case 'paused':
                this.consoleLog.warn('no run: paused, use resume instead');
                break;
            default:
                break;
        }
    }

    hasAction(actionName: 'stop' | 'resume' | 'pause') {
        return !!this._actions[actionName];
    }

    getAvailableActions() {
        const list: TaskActionAvailability = {
            stop: !!this._actions['stop'],
            resume: !!this._actions['resume'],
            pause: !!this._actions['pause'],
        };

        return list;
    }

    protected async action(actionName: 'stop' | 'resume' | 'pause') {
        const actionFn = this._actions[actionName];
        if (actionFn) {
            const result = await actionFn();
            if (result) this.emit('updated');
            return result;
        } else {
            this.consoleLog.warn(
                `action "${actionName}" called, but not defined`
            );
            return false;
        }
    }

    async stop() {
        if (this.state === 'running' || this.state === 'paused')
            await this.action('stop');
    }

    async pause() {
        if (this.state === 'running') await this.action('pause');
    }

    async resume() {
        if (this.state === 'paused') await this.action('resume');
    }

    dataToPersist(inputOptions?: Partial<IPersistedTaskSpecificAttributes>) {
        const options = _.defaults(inputOptions, {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const serializedData = _.omit(this.serialize(), ['id']);

        const persistedTask: IPersistedTask = {
            ...options,
            ...serializedData,
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

    waitUntilStop() {
        if (this._state !== 'running' && this._state !== 'paused')
            return Promise.resolve();
        return new Promise<void>((resolve) => {
            const resolver = () => {
                if (this._state === 'running' || this._state === 'paused')
                    return;
                this.off('update', resolver);
                resolve();
            };

            this.on('update', resolver);
        });
    }

    protected static _serializeAny(obj?: any) {
        if (obj === undefined) return undefined;
        return JSON.parse(JSON.stringify(obj));
    }
}
