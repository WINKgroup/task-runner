import { LogLevel } from '@winkgroup/console-log'
import Cron from '@winkgroup/cron'
import fs from 'fs'
import TaskFactory from '../src/factory'
import TaskRunnerMongo from '../src/runnerMongo'
import { TimeoutTaskFactory } from './timeoutTask'

function setupRunner() {
    const configStr = fs.readFileSync('./tests/config.json', 'utf-8')
    const config = JSON.parse(configStr)
    const dbUri = config.dbUri
    const runner = new TaskRunnerMongo(dbUri)
    const factory = new TimeoutTaskFactory()
    runner.topicFactory[''] = factory
    runner.consoleLog.generalOptions.verbosity = LogLevel.DEBUG
    runner.erase()
    return runner
}

const cronCreator = new Cron(8)
const runner = setupRunner()

setInterval( () => {
    if (cronCreator.tryStartRun()) {
        const taskPersisted = TaskFactory.emptyTaskPersisted()
        cronCreator.runCompleted()
        runner.saveTask(taskPersisted)
    }
    runner.cron()
}, 5000)