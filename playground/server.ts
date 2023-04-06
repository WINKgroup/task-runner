import ConsoleLog, { LogLevel } from '@winkgroup/console-log';
import Webserver from '@winkgroup/webserver';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import TaskRunner from '../src/index';
import { TaskFactoryTimeout } from './timeoutTask';

const factory = new TaskFactoryTimeout();
const webserver = new Webserver({ name: 'Demo Server', hasSocket: true });
const ioApp = webserver.ioApp!;
webserver.app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, './index.html'))
);

const configStr = fs.readFileSync('playground/config.json', 'utf-8');
const config = JSON.parse(configStr);
mongoose.connect(config.dbUri);
const TaskModel = TaskRunner.getModelFromParams(
    mongoose,
    config.collectionName
);

function setupRunners() {
    const runner1 = new TaskRunner({
        instance: 'runner1',
        Model: TaskModel,
        io: {
            publicUrl: '',
            server: ioApp.of('tasks1'),
        },
        consoleLog: new ConsoleLog({
            verbosity: LogLevel.INFO,
            prefix: 'TaskRunner1',
        }),
    });
    runner1.registerFactory(factory);
    runner1.erase();

    const runner2 = new TaskRunner({
        Model: TaskModel,
        instance: 'runner2',
        startActive: false,
        io: {
            publicUrl: 'http://127.0.0.1:8080/tasks2',
            server: ioApp.of('tasks2'),
        },
        consoleLog: new ConsoleLog({
            verbosity: LogLevel.INFO,
            prefix: 'TaskRunner2',
        }),
    });
    runner2.registerFactory(factory);

    return [runner1, runner2];
}

const [runner1, runner2] = setupRunners();

setInterval(() => {
    runner1.cron();
    runner2.cron();
}, 1500);

console.log(
    'VISIT http://127.0.0.1:8080/ and open your browser console log to test it!'
);
webserver.listen();
