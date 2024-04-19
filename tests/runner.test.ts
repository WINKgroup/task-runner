import { ConsoleLogLevel } from '@winkgroup/console-log';
import TaskThrowing, { TaskFactoryThrowing } from '../playground/throwingTask';
import TaskRunner from '../src/index';
import TestConfig from './config';

const config = new TestConfig();

test("throwing task doesn't break runner", (completed) => {
    const Model = TaskRunner.getModelFromParams(config.conn, 'throwing');
    const runner = new TaskRunner({
        Model,
        instance: 'throwing runner',
        versionedTopicFactories: { 'throwing#1': new TaskFactoryThrowing() },
        maxRunningTasks: 1,
    });
    runner.consoleLog.generalOptions.verbosity = ConsoleLogLevel.DEBUG;

    for (let i = 0; i < 10; i++) {
        const task = new TaskThrowing({ versionedTopic: 'throwing#1' });
        const taskData = task.dataToPersist();
        const doc = new Model(taskData);
        doc.save();
    }

    let counter = 0;
    let errors = 0;
    const interval = setInterval(async () => {
        ++counter;
        if (counter > 20) {
            clearInterval(interval);
            expect(errors).toBe(10); // since before throwing error, TaskThrowing set state to completed
            completed();
        }
        await runner.cron().catch(() => ++errors);
    }, 300);
}, 20000);

afterAll(async () => {
    await config.dropDbAndClose();
}, 10000);
