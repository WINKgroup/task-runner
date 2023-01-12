import ConsoleLog from '@winkgroup/console-log';
import Cron from '@winkgroup/cron';
import _ from 'lodash';
import { EventEmitter } from 'node:events';
import { Namespace } from 'socket.io';
import {
    getEmptyPersistedTask,
    IPersistedTask,
    IPersistedTaskSpecificAttributes,
    TaskRunnerFindTasksParams,
    TaskRunnerRunPersistedTaskOptions,
} from './common';
import TaskFactory from './factory';
import Task from './task';

export interface TaskRunnerOptions {
    instance: string;
    everySeconds: number;
    topicFactories: { [topic: string]: TaskFactory };
    maxRunningTasks: number;
    startActive: boolean;
    consoleLog: ConsoleLog;
    ioNamespace: Namespace;
    housekeeperEverySeconds: number;
}

export default abstract class TaskRunnerAbstract extends EventEmitter {
    instance: string;
    cronObj: Cron;
    versionedTopicFactories = {} as { [versionedTopic: string]: TaskFactory };
    maxRunningTasks: number;
    consoleLog: ConsoleLog;
    io?: Namespace;

    protected _active: boolean;
    protected _setup = false;
    protected _runningTasks = {} as { [key: string]: Task };
    houseKeeperCronObj: Cron;

    constructor(inputOptions?: Partial<TaskRunnerOptions>) {
        super();
        const options = _.defaults(inputOptions, {
            instance: 'default',
            everySeconds: 0,
            maxRunningTasks: 5,
            startActive: true,
            consoleLog: new ConsoleLog({ prefix: 'Task Runner' }),
            housekeeperEverySeconds: 10 * 60,
        });

        this.instance = options.instance;
        this.cronObj = new Cron(options.everySeconds, options.consoleLog);
        this.maxRunningTasks = options.maxRunningTasks;
        this._active = options.startActive;
        this.consoleLog = options.consoleLog;
        this.io = options.ioNamespace;
        this.houseKeeperCronObj = new Cron(
            options.housekeeperEverySeconds,
            options.consoleLog
        );

        this.setIo();
    }

    get active() {
        return this._active;
    }

    get list() {
        return Object.values(this._runningTasks);
    }
    get taskIds() {
        return Object.keys(this._runningTasks);
    }
    get numOfRunningTasks() {
        return Object.keys(this._runningTasks).length;
    }

    abstract findPersistedTasks(
        params: Partial<TaskRunnerFindTasksParams>
    ): Promise<IPersistedTask[]>;
    abstract savePersistedTask(persistedTask: IPersistedTask): Promise<boolean>;
    abstract getPersistedTaskById(
        id: string
    ): Promise<IPersistedTask | null>;
    abstract deletePersistedTaskById(id: string): Promise<void>;
    abstract erase(): Promise<void>;
    abstract deletePersistedTasksMarked(): Promise<void>;
    protected abstract loadTasks(
        numOfTasksToLoad: number
    ): Promise<IPersistedTask[]>;

    start() {
        const needsRun = !this._active;
        this._active = true;
        if (needsRun) this.run();
    }

    async stop(force = false) {
        if (!this._active) return;
        this._active = false;
        await Promise.all(
            this.taskIds.map((id) => {
                const task = this._runningTasks[id]
                if (force && task.stop) {
                    return task.stop();
                } else {
                    if (force)
                        this.consoleLog.warn(
                            `unable to perform "force" option since task ${ id } has no stop method`
                        );
                    const waitForEnd = () =>
                        new Promise<void>((resolve) => {
                            task.on('ended', resolve);
                        });
                    return waitForEnd;
                }
            })
        );
    }

    protected loadTasksQueryObj() {
        const topics = Object.keys(this.versionedTopicFactories);
        const now = new Date().toISOString();
        const queryObj: { [key: string]: any } = {
            state: 'to do',
            versionedTopic: { $in: topics },
            worker: { $exists: false },
            $or: [
                { waitUntil: { $exists: false } },
                { waitUntil: { $lte: now } },
            ],
        };

        return queryObj;
    }

    registerFactory(factory: TaskFactory, versionedTopics = ['default#1']) {
        for (const versionedTopic of versionedTopics) {
            this.versionedTopicFactories[versionedTopic] = factory;
            this.consoleLog.print(`new factory registered for topic "${ versionedTopic }"`);
        }
    }

    getFactory(versionedTopic = 'default#1') {
        const factory = this.versionedTopicFactories[versionedTopic];
        if (!factory)
            throw new Error(`no factory registered for topic "${ versionedTopic }"`);
        return factory;
    }

    unpersistTask(persistedTask: IPersistedTask) {
        const factory = this.getFactory(persistedTask.versionedTopic);
        return factory.unpersist(persistedTask);
    }

    async createPersistedTask(
        inputPersistedTask: Partial<IPersistedTask>,
        save = false
    ) {
        const persistedTask: IPersistedTask = _.defaults(inputPersistedTask, {
            ...getEmptyPersistedTask(),
            applicant: this.instance,
        });

        if (save) await this.savePersistedTask(persistedTask);
    }

    async persistTask(
        task: Task,
        versionedTopic: string,
        inputOptions?: Omit<Partial<IPersistedTaskSpecificAttributes>, 'versionedTopic'>,
        save = false
    ) {
        const options = _.defaults(inputOptions, { applicant: this.instance });
        const persistedTask = task.persist(versionedTopic, options);

        if (save) await this.savePersistedTask(persistedTask);
        return persistedTask;
    }

    async lockPersistedTask(persistedTask: IPersistedTask) {
        const id = persistedTask.id;

        if (persistedTask.worker) {
            this.consoleLog.warn(
                `task ${id} already running at ${persistedTask.worker}, not running it again`
            );
            return;
        }

        persistedTask.worker = this.instance;
        persistedTask.updatedAt = (new Date()).toISOString()
        const isLocked = await this.savePersistedTask(persistedTask);
        if (!isLocked) {
            this.consoleLog.warn(`unable to lock task ${id}`);
            delete persistedTask.worker;
        } else this.consoleLog.debug(`task ${id} locked`);

        return isLocked;
    }

    async runPersistedTask(
        persistedTask: IPersistedTask,
        inputOptions?: Partial<TaskRunnerRunPersistedTaskOptions>
    ) {
        const options: TaskRunnerRunPersistedTaskOptions = _.defaults(
            inputOptions,
            {
                lockTask: true,
                forceRunning: false,
            }
        );
        const id = persistedTask.id;
        if (!options.forceRunning && persistedTask.state === 'completed') {
            this.consoleLog.warn(
                `task ${id} already completed: not running it again`
            );
            return;
        }
        if (options.lockTask && !(await this.lockPersistedTask(persistedTask)))
            return;

        this.consoleLog.debug(`running task ${id}...`);
        const task = this.unpersistTask(persistedTask);
        this._runningTasks[id] = task;
        task.consoleLog.generalOptions.verbosity =
            this.consoleLog.generalOptions.verbosity;
        await task.run();

        persistedTask = task.persist(persistedTask.versionedTopic, {
            id: id,
            createdAt: persistedTask.createdAt,
            applicant: persistedTask.applicant,
            priority: persistedTask.priority
        });

        if (options.lockTask) delete persistedTask.worker;
        await this.savePersistedTask(persistedTask);
        delete this._runningTasks[persistedTask.id];
    }

    async run() {
        if (!this._active) {
            this.consoleLog.debug('not active, run aborted');
            return;
        }
        const tasksToStart = this.maxRunningTasks - this.numOfRunningTasks;
        this.consoleLog.debug(
            `running tasks ${this.numOfRunningTasks}/${this.maxRunningTasks}`
        );
        if (tasksToStart <= 0) return;

        const numOfFactories = Object.values(this.versionedTopicFactories).length;
        if (numOfFactories === 0)
            this.consoleLog.warn(
                'no factory registered, likely no task will be run'
            );

        const persistedTasks = await this.loadTasks(tasksToStart);
        persistedTasks.map((persistedTask) =>
            this.runPersistedTask(persistedTask)
        );
    }

    async cron() {
        if (this.cronObj.tryStartRun()) {
            await this.run();
            this.cronObj.runCompleted();
        }

        if (this.houseKeeperCronObj.tryStartRun()) {
            await this.deletePersistedTasksMarked();
            this.houseKeeperCronObj.runCompleted();
        }
    }

    isIoTokenValid(token: string) {
        return true;
    }

    setIo() {
        if (!this.io) return;

        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!this.isIoTokenValid(token)) next(new Error('access denied'));
            else next();
        });

        this.io.on('connection', (socket) => {
            this.consoleLog.debug('client connected');
            socket.on('start', () => {
                this._active = true;
            });
            socket.on('stop', (force?: boolean) => this.stop(force));
        });
    }
}
