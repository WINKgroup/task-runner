import Db from '@winkgroup/db-mongo'
import fs from 'fs'
import TaskRunnerMongo from '../src/runnerMongo'
import TimeoutTask, { TimeoutTaskFactory } from './timeoutTask'

jest.setTimeout(10000)

let dbUri:string
let runner = null as TaskRunnerMongo | null

beforeAll(async () => {
    const configStr = fs.readFileSync('./tests/config.json', 'utf-8')
    const config = JSON.parse(configStr)
    dbUri = config.dbUri
    runner = new TaskRunnerMongo(config.dbUri)
    runner.topicFactory['timeout'] = new TimeoutTaskFactory()
})

test('a task should be added', async () => {
    const r = runner as TaskRunnerMongo
    const Model = r.getModel()
    const timeoutFactory = new TimeoutTaskFactory()
    const persistedTask = timeoutFactory.persist( new TimeoutTask() )
    await r.saveTask(persistedTask)
    const count = await Model.countDocuments()
    expect(count).toBe(1)
})

afterAll( async () => {
    await runner!.erase()
    const db = Db.get(dbUri)
    await db.close()
})
