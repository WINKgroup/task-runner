import Cron from '@winkgroup/cron';
import _ from 'lodash';
import { InputTask, IPersistedTask } from '../src/common';
import TaskFactory from '../src/factory';
import Task from '../src/task';

export class TaskFactoryTimeout extends TaskFactory {
    unpersist(taskPersisted: IPersistedTask) {
        return new TaskTimeout(taskPersisted);
    }
}

export default class TaskTimeout extends Task {
    data: number;

    protected _stop = undefined;
    protected _pause = undefined;
    protected _resume = undefined;
    protected _recover = undefined;

    timeoutObj?: NodeJS.Timeout;

    constructor(inputTask: InputTask) {
        inputTask = _.defaults(inputTask, { data: 10000 });
        super(inputTask);
        this.data = inputTask.data;
    }

    _run() {
        const data = this.data as number;

        const task = this as TaskTimeout;
        return new Promise<void>((resolve) => {
            task.consoleLog.print('started');
            this.timeoutObj = setTimeout(() => {
                task.consoleLog.print('ended');
                task.setCompleted();
                resolve();
            }, data);
        });
    }
}
