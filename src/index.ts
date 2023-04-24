import ConsoleLog from '@winkgroup/console-log';
import Cron from '@winkgroup/cron';
import MongoHelper, { QueryParams, RealtimeQuery } from '@winkgroup/db-mongo';
import { ChangeQueryDocumentList } from '@winkgroup/db-mongo/dist/queryCache';
import _ from 'lodash';
import { Namespace, Server as IoServer } from 'socket.io';
import {
    clientAddressableAttributes,
    InputTask,
    IPersistedTask,
    IPersistedTaskSpecificAttributes,
    PersistedTaskWithId,
    SerializedTask,
    TaskActionAvailability,
    TaskActions,
    TaskSignal,
} from './common';
import TaskFactory from './factory';
import { ITaskDoc, ITaskModel, schema } from './model';
import Task from './task';
import mongoose, { Connection } from 'mongoose';

export interface InputTaskRunnerIo {
    publicUrl: string;
    server: Namespace | IoServer;
}

export interface InputTaskRunner {
    Model: ITaskModel;
    instance?: string;
    everySeconds?: number;
    topicFactories?: { [topic: string]: TaskFactory };
    maxRunningTasks?: number;
    startActive?: boolean;
    consoleLog?: ConsoleLog;
    io?: InputTaskRunnerIo;
    housekeeperEverySeconds?: number;
}

export interface TaskCouple {
    task: Task;
    doc: ITaskDoc;
}

export default class TaskRunner {
    instance: string;
    Model: ITaskModel;
    consoleLog: ConsoleLog;

    versionedTopicFactories = {} as { [versionedTopic: string]: TaskFactory };
    maxRunningTasks: number;

    protected io?: {
        publicUrl: string;
        server: Namespace | IoServer;
        realtimeQuery: RealtimeQuery<SerializedTask & { _id: any }>;
        querySubscriptionsBySocket: { [socketId: string]: string[] };
    };

    protected _active: boolean;
    protected _setup = false;
    protected _runningTasks = {} as { [id: string]: TaskCouple };

    cronObj: Cron;
    houseKeeperCronObj: Cron;

    constructor(input: InputTaskRunner) {
        const options = _.defaults(input, {
            instance: 'default',
            everySeconds: 0,
            maxRunningTasks: 5,
            startActive: true,
            consoleLog: new ConsoleLog({ prefix: 'Task Runner' }),
            housekeeperEverySeconds: 10 * 60,
        });

        this.instance = options.instance;
        this.Model = options.Model;
        this.consoleLog = options.consoleLog;

        this.maxRunningTasks = options.maxRunningTasks;

        if (options.io) this.setIo(options.io);

        this.cronObj = new Cron(options.everySeconds, options.consoleLog);
        this.houseKeeperCronObj = new Cron(
            options.housekeeperEverySeconds,
            options.consoleLog
        );

        this._active = false;
        if (options.startActive) process.nextTick(() => this.start());
    }

    get active() {
        return this._active;
    }

    get runningList() {
        return Object.values(this._runningTasks);
    }
    get runningIds() {
        return Object.keys(this._runningTasks);
    }
    get numOfRunningTasks() {
        return Object.keys(this._runningTasks).length;
    }

    unpersistTask(persistedTask: PersistedTaskWithId) {
        const factory =
            this.versionedTopicFactories[persistedTask.versionedTopic];
        if (!factory)
            throw new Error(
                `Factory for topic "${persistedTask.versionedTopic}" not found`
            );

        return factory.unpersist(persistedTask);
    }

    async getPersistedTaskById(id: string) {
        const doc = await this.Model.findById(id);
        if (!doc) return null;
        return doc.toPersistedWithId();
    }

    async getTaskById(id: string) {
        const persistedTask = await this.getPersistedTaskById(id);
        if (!persistedTask) return persistedTask;
        return this.unpersistTask(persistedTask);
    }

    async addTaskFromClientAddressableAttributes(
        attributes: Partial<IPersistedTask>
    ) {
        attributes = _.pick(attributes, clientAddressableAttributes);
        attributes = _.omit(attributes, 'id');

        const versionedTopic = attributes.versionedTopic;
        if (!versionedTopic || !this.versionedTopicFactories[versionedTopic]) {
            this.consoleLog.error(
                `not registered versionedTopic "${versionedTopic}" in addTaskFromClientAddressableAttributes`
            );
            return 'not registered versionedTopic';
        } else {
            const factory = this.versionedTopicFactories[versionedTopic];
            const errors =
                factory.validateClientAddressableAttributes(attributes);
            if (errors.length > 0) return errors[0];
        }

        const doc = this.Model.createEmpty(versionedTopic);
        doc.updateData(attributes);
        try {
            await doc.save();
            return doc;
        } catch (e) {
            if (e instanceof Error) return e.message;
            return 'error';
        }
    }

    async erase() {
        const db = await MongoHelper.waitForMongoDbConnected(this.Model.db);
        await db.dropCollection(this.Model.collection.name);
        this.consoleLog.print('tasks erased');
    }

    async start() {
        const needsRun = !this._active;
        this._active = true;
        if (needsRun) this.run();
    }

    async stop(force = false) {
        if (!this._active) return;
        this._active = false;
        await Promise.all(
            this.runningIds.map((id) => {
                const task = this._runningTasks[id].task;
                if (force && task.hasAction('stop')) return task.stop();
                else return task.waitUntilStop();
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
            this.consoleLog.print(
                `new factory registered for topic "${versionedTopic}"`
            );
        }
    }

    getFactory(versionedTopic = 'default#1') {
        const factory = this.versionedTopicFactories[versionedTopic];
        if (!factory)
            throw new Error(
                `no factory registered for topic "${versionedTopic}"`
            );
        return factory;
    }

    async lockTask(doc: ITaskDoc) {
        if (doc.worker) {
            this.consoleLog.warn(
                `task ${doc.id} already locked at ${doc.worker}, not locking it again`
            );
            return false;
        }

        doc.worker = this.instance;
        doc.updatedAt = new Date().toISOString();
        try {
            await doc.save();
            const newDoc = await this.Model.findById(doc._id);
            if (!newDoc || newDoc.worker !== this.instance) {
                if (newDoc) doc.worker = newDoc.worker;
                this.consoleLog.warn(
                    `task ${doc.id} already locked at ${doc.worker}, not locking it again`
                );
                return false;
            }
            this.consoleLog.debug(`task ${doc.id} locked`);
            return true;
        } catch (e) {
            this.consoleLog.warn(`unable to lock task ${doc.id}`);
            delete doc.worker;
            return false;
        }
    }

    async runTask(taskCouple: TaskCouple) {
        const { doc, task } = taskCouple;
        this.consoleLog.debug(`running task ${task.id}...`);

        const isLocked = await this.lockTask(doc);
        if (!isLocked) {
            this.consoleLog.debug(`stop running task ${task.id}: no lock`);
            return;
        }

        task.consoleLog.generalOptions.verbosity =
            this.consoleLog.generalOptions.verbosity;

        let isSaving = false;
        const waitForSaved = () =>
            new Promise<void>((resolve) => {
                if (!isSaving) {
                    resolve();
                    return;
                }
                const handler = setInterval(() => {
                    if (isSaving) return;
                    clearInterval(handler);
                    resolve();
                }, 100);
            });

        const updater = async () => {
            doc.updateData(task.serialize());
            await waitForSaved();
            isSaving = true;
            this.consoleLog.debug(JSON.stringify(doc.toPersistedWithId()));
            await doc.save();
            isSaving = false;
        };

        const emitProgress = (data: any) => {
            const progressInfo = {
                taskId: task.id,
                data: data,
            };
            this.io!.server.emit('progress', progressInfo);
        };

        task.on('updated', updater);
        if (this.io) task.on('progress', emitProgress);

        await task.run();

        task.off('updated', updater);
        if (this.io) task.off('progress', emitProgress);

        await waitForSaved();
        doc.worker = undefined;
        doc.publicUrl = undefined;
        this.consoleLog.debug(JSON.stringify(doc.toPersistedWithId()));
        await doc.save();
        delete this._runningTasks[task.id];
    }

    async loadTasks(tasksToLoad: number) {
        const queryObj = this.loadTasksQueryObj();

        let query = this.Model.find(queryObj).sort('-priority');
        if (tasksToLoad > 0) query = query.limit(tasksToLoad);
        const docs = await query.exec();
        this.consoleLog.debug(`${docs.length} tasks loaded`);
        const result = docs.map((doc) => {
            const taskData = doc.toPersistedWithId();
            const couple: TaskCouple = {
                doc: doc,
                task: this.unpersistTask(taskData),
            };

            return couple;
        });
        return result;
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

        const numOfFactories = Object.values(
            this.versionedTopicFactories
        ).length;
        if (numOfFactories === 0)
            this.consoleLog.warn(
                'no factory registered, likely no task will be run'
            );

        const couples = await this.loadTasks(tasksToStart);
        couples.map((couple) => this.runTask(couple));
    }

    async setCronTasks() {
        if (!this._active) {
            this.consoleLog.debug('not active, run aborted');
            return;
        }

        const factoryMap = {} as { [versionedTopic: string]: TaskFactory };
        const factories = Object.values(this.versionedTopicFactories);
        if (factories.length === 0) return;
        const topics = [] as string[];

        for (const factory of factories) {
            for (const topic of factory.cronVersionedTopics) {
                factoryMap[topic] = factory;
                topics.push(topic);
            }
        }
        const queryObj: { [key: string]: any } = {
            versionedTopic: { $in: topics },
        };
        const docs = await this.Model.find({
            queryObj: queryObj,
        });
        for (const doc of docs) delete factoryMap[doc.versionedTopic];
        for (const topic in factoryMap) {
            const factory = factoryMap[topic];
            const cronPersistedTasks = await factory.createCronPersistedTasks(
                topic
            );
            Promise.all(
                cronPersistedTasks.map((cronPersistedTask) => {
                    const doc = new this.Model(cronPersistedTask);
                    return doc.save();
                })
            );
        }
    }

    async deletePersistedTasksMarked() {
        const now = new Date().toISOString();
        const result = await this.Model.deleteMany({ deleteAt: { $lt: now } });
        this.consoleLog.debug(`${result.deletedCount} tasks deleted`);
    }

    async taskRecovery() {
        const old = Cron.comeBackIn(-8 * 3600 * 1000);
        const topics = Object.keys(this.versionedTopicFactories);
        const list = await this.Model.find({
            versionedTopic: { $in: topics },
            updatedAt: { $lt: old },
            'availableActions.recover': true,
        });
        this.consoleLog.debug(
            `found ${list.length} tasks that can be recovered`
        );
        return Promise.all(
            list.map(async (doc) => {
                const task = this.unpersistTask(doc.toPersistedWithId());
                const result = await task.recover();
                if (!result)
                    this.consoleLog.debug(
                        `unable to recover task "${task.id}"`
                    );
            })
        );
    }

    async cron() {
        if (this.cronObj.tryStartRun()) {
            await this.run();
            this.cronObj.runCompleted();
        }

        if (this.houseKeeperCronObj.tryStartRun()) {
            await Promise.all([
                this.deletePersistedTasksMarked(),
                this.setCronTasks(),
                this.taskRecovery(),
            ]);
            this.houseKeeperCronObj.runCompleted();
        }
    }

    async setIo(options: InputTaskRunnerIo) {
        const server = options.server;
        const querySubscriptionsBySocket = {} as {
            [socketId: string]: string[];
        };
        const db = await MongoHelper.waitForMongoDbConnected(this.Model.db);
        const realtimeQuery = new RealtimeQuery<SerializedTask & { _id: any }>({
            db: db,
            collectionName: this.Model.collection.name,
        });

        this.io = {
            ...options,
            realtimeQuery: realtimeQuery,
            querySubscriptionsBySocket: {},
        };

        server.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (1 !== 1) next(new Error('access denied'));
            else next();
        });

        const Model = this.Model;
        const io = this.io;

        server.on('connection', (socket) => {
            this.consoleLog.debug('client connected');

            socket.emit('taskRunnerInfo', {
                instance: this.instance,
            });

            socket.on(
                'add',
                async (persistedData: IPersistedTask, callback) => {
                    try {
                        if (!persistedData.versionedTopic)
                            persistedData.versionedTopic = 'default#1';
                        this.consoleLog.debug(
                            `adding new task from client: ${JSON.stringify(
                                persistedData
                            )}`
                        );
                        const doc =
                            await this.addTaskFromClientAddressableAttributes(
                                persistedData
                            );
                        if (typeof doc === 'string') callback(doc);
                        else callback(doc.toPersistedWithId());
                    } catch (e) {
                        const err = JSON.stringify(e);
                        this.consoleLog.error(err);
                        callback(err);
                    }
                }
            );

            socket.on('remove', async (idObj: { id: string }, callback) => {
                try {
                    let doc: ITaskDoc;
                    if (!this._runningTasks[idObj.id]) {
                        const result = await this.Model.findById(idObj.id);
                        if (!result) {
                            const err = `unable to find task with id ${idObj.id}`;
                            this.consoleLog.debug(err);
                            callback(err);
                            return;
                        }
                        doc = result;
                    } else doc = this._runningTasks[idObj.id].doc;
                    if (doc.state === 'paused' || doc.state === 'running') {
                        const err = `unable to delete task with id ${idObj.id} in ${doc.state} state`;
                        this.consoleLog.debug(err);
                        callback(err);
                        return;
                    }
                    await doc.deleteOne();
                    this.consoleLog.debug(
                        `client asked to remove task: ${JSON.stringify(idObj)}`
                    );
                    callback();
                } catch (e) {
                    const err = JSON.stringify(e);
                    this.consoleLog.error(err);
                    callback(err);
                }
            });

            socket.on(
                'subscribeQuery',
                async (params: QueryParams, callback) => {
                    const mongoDoc2PersistedWithId = function (
                        doc: SerializedTask & {
                            _id: any;
                        }
                    ) {
                        const changeMongooseDoc = new Model(doc);
                        return changeMongooseDoc.toPersistedWithId();
                    };

                    const result = {
                        list: [],
                    } as {
                        subscriptionId?: string;
                        error?: any;
                        list: PersistedTaskWithId[];
                    };

                    try {
                        const docs = await this.io!.realtimeQuery._find(params);
                        result.list = docs.map((doc) =>
                            mongoDoc2PersistedWithId(doc)
                        );
                        const subscriptionId = realtimeQuery.subscribe(
                            params,
                            (list, changeDoc, changeList) => {
                                const changeObj: ChangeQueryDocumentList<PersistedTaskWithId> =
                                    {
                                        operationType: changeList.operationType,
                                        position: changeList.position,
                                    };

                                if (changeList.operationType !== 'multiple') {
                                    if (changeList.doc)
                                        changeObj.doc =
                                            mongoDoc2PersistedWithId(
                                                changeList.doc
                                            );
                                    socket.emit('change', changeObj);
                                } else
                                    socket.emit(
                                        'list',
                                        list.map((doc) =>
                                            mongoDoc2PersistedWithId(doc)
                                        )
                                    );
                            }
                        );

                        if (!querySubscriptionsBySocket[socket.id])
                            querySubscriptionsBySocket[socket.id] = [
                                subscriptionId,
                            ];
                        else
                            querySubscriptionsBySocket[socket.id].push(
                                subscriptionId
                            );
                        this.consoleLog.debug(
                            `subscribed query (id: ${subscriptionId}): ${JSON.stringify(
                                params
                            )}`
                        );
                        result.subscriptionId = subscriptionId;
                        callback(result);
                    } catch (e) {
                        this.consoleLog.error(e as string);
                        result.error = e;
                        callback(result);
                    }
                }
            );

            io.realtimeQuery.start();
        });
    }

    static getModelFromParams(
        conn: Connection | typeof mongoose,
        collectionName = 'tasks'
    ) {
        if (conn.models[collectionName])
            return conn.models[collectionName] as ITaskModel;

        return conn.model<ITaskDoc, ITaskModel>(collectionName, schema);
    }
}

export {
    TaskFactory,
    ITaskDoc,
    ITaskModel,
    Task,
    clientAddressableAttributes,
    TaskSignal,
    TaskActions,
    TaskActionAvailability,
    SerializedTask,
    IPersistedTaskSpecificAttributes,
    InputTask,
    IPersistedTask,
    PersistedTaskWithId,
    schema,
};
