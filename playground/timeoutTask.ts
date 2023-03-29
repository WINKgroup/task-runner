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

    timeoutObj?: NodeJS.Timeout;

    constructor(inputTask: InputTask) {
        inputTask = _.defaults(inputTask, { data: 10000 });
        super(inputTask);
        this.data = inputTask.data;
        this.consoleLog.generalOptions.prefix = 'TimeoutTask'
    }

    _run() {
        const data = this.data as number;

        const task = this as TaskTimeout;
        return new Promise<void>((resolve) => {
            task.consoleLog.print('started');
            let duration = 0
            const step = 300
            const interval = setInterval( () => {
                duration += step
                this.emit('progress', { spent: duration, total: this.data })
                if (duration >= data) {
                    clearInterval(interval)
                    task.consoleLog.print('ended');
                    task._response = 100
                    task.setCompleted();
                    resolve()
                }
            }, step )
        });
    }
}
