import _ from 'lodash';
import { InputTask, IPersistedTask } from '../src/common';
import TaskFactory from '../src/factory';
import Task from '../src/task';

export class TaskFactoryThrowing extends TaskFactory {
    unpersist(taskPersisted: IPersistedTask) {
        return new TaskThrowing(taskPersisted);
    }
}

export default class TaskThrowing extends Task {
    constructor(inputTask: InputTask) {
        super(inputTask);
        this.consoleLog.generalOptions.prefix = 'ThrowingTask';
    }

    isProgressEmitter(): boolean {
        return true;
    }

    _run() {
        const task = this as TaskThrowing;
        return new Promise<void>((resolve, reject) => {
            task.consoleLog.print('started');
            setTimeout(() => {
                task.consoleLog.print('sending error');
                this._state = 'completed';
                reject('general error');
            }, 300);
        });
    }
}
