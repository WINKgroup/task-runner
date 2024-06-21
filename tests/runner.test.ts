import { ConsoleLogLevel } from '@winkgroup/console-log';
import TaskThrowing, { TaskFactoryThrowing } from '../playground/throwingTask';
import TaskRunner, { waitForTask } from '../src/index';
import TestConfig from './config';
import TaskTimeout, { TaskFactoryTimeout } from '../playground/timeoutTask';
import { waitForMs } from '@winkgroup/cron';

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

test('waitForTask', async () => {
    const Model = TaskRunner.getModelFromParams(config.conn, 'waitForTask');
    const runner = new TaskRunner({
        Model,
        instance: 'waitForTask runner',
        versionedTopicFactories: { 'dummy#1': new TaskFactoryTimeout() },
    });
    runner.consoleLog.generalOptions.verbosity = ConsoleLogLevel.DEBUG;
    const task = new TaskTimeout({ versionedTopic: 'dummy#1', data: 5000 });
    const taskData = task.dataToPersist();
    const doc = new Model(taskData);
    await doc.save();

    const interval = setInterval(async () => {
        await runner.cron();
    }, 2000);

    const completedTask = await waitForTask({
        taskId: doc._id.toString(),
        runnerModel: Model,
    });

    expect(completedTask.state).toBe('completed');
    clearInterval(interval);
    await waitForMs(2000);
}, 20000);

afterAll(async () => {
    await config.dropDbAndClose();
}, 10000);
