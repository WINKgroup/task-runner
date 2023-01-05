import Db from "@winkgroup/db-mongo"
import _ from "lodash"
import { IPersistedTask, TaskRunnerFindTasksParams } from "./common"
import { ITaskDoc, ITaskModel, schema } from "./modelTaskPersisted"
import TaskRunnerAbstract, { TaskRunnerOptions } from "./runnerAbstract"

export interface TaskRunnerMongoOptions extends TaskRunnerOptions {
    collection: string

}
export default class TaskRunnerMongo extends TaskRunnerAbstract {
    dbUri:string
    collection:string

    constructor(dbUri:string, inputOptions?:Partial<TaskRunnerMongoOptions>) {
        const options = _.defaults(inputOptions, { collection: 'task' })
        super(options)
        this.dbUri = dbUri
        this.collection = options.collection
    }

    getModel() {
        const db = Db.get(this.dbUri)
        return db.model<ITaskDoc, ITaskModel>(this.collection, schema)
    }

    async erase(withS = true) {
        const db = Db.get(this.dbUri)
        await db.dropCollection(withS ? this.collection + 's' : this.collection)
        this.consoleLog.print('tasks erased')
    }

    async getPersistedTaskById(persistedId:string) {
        const Model = this.getModel()
        const doc = await Model.findOne({persistedId: persistedId})
        return doc ? doc.toObject() as IPersistedTask : null
    }

    async deletePersistedTaskById(persistedId:string) {
        const Model = this.getModel()
        await Model.deleteOne({persistedId: persistedId})
    }

    async findPersistedTasks(inputParams: Partial<TaskRunnerFindTasksParams>) {
        const Model = this.getModel()
        const params:TaskRunnerFindTasksParams = _.defaults(inputParams, {
            queryObj: {},
            limit: 0,
            skip: 0,
            sort: ''
        })

        let query = Model.find(params.queryObj)
        if (params.limit) query = query.limit(params.limit)
        if (params.skip) query = query.skip(params.skip)
        if (params.sort) query = query.sort(params.sort)
        const taskDocs = await query.exec()
        this.consoleLog.debug(`${ taskDocs.length } tasks found`)
        return taskDocs.map( taskDoc => taskDoc.toObject() as IPersistedTask )
    }

    async loadTasks(tasksToLoad:number) {
        const Model = this.getModel()
        const queryObj = this.loadTasksQueryObj()

        let query = Model.find(queryObj).sort('-priority')
        if (tasksToLoad > 0) query = query.limit(tasksToLoad)
        const taskDocs = await query.exec()
        this.consoleLog.debug(`${ taskDocs.length } tasks loaded`)
        return taskDocs.map( taskDoc => taskDoc.toObject() as IPersistedTask )
    }

    async savePersistedTask(persistedTask:IPersistedTask) {
        const Model = this.getModel()

        try {
            const taskDoc = await Model.findOne({ persistedId: persistedTask.persistedId })
            if (taskDoc) {
                taskDoc.overwrite(persistedTask)
                await taskDoc.save()
            } else {
                const newDoc = new Model(persistedTask)
                await newDoc.save()
            }
            this.consoleLog.debug(`task ${ persistedTask.persistedId } saved`)
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async deletePersistedTasksMarked() {
        const Model = this.getModel()
        const now = (new Date()).toISOString()
        const result = await Model.deleteMany({ deleteAt: { $lt: now } })
        this.consoleLog.debug(`${ result.deletedCount } tasks deleted`)
    }
}