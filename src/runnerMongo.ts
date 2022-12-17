import Db from "@winkgroup/db-mongo"
import _ from "lodash"
import { ObjectId } from "mongodb"
import { ITaskPersisted, persistedTaskTitle, TaskRunnerFindTasksParams, TaskRunnerMongoOptions } from "./common"
import { ITaskDoc, ITaskModel, schema } from "./modelTaskPersisted"
import TaskRunnerAbstract from "./runnerAbstract"

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

    protected doc2persisted(doc: ITaskDoc) {
        const task = doc.toObject() as ITaskPersisted
        task.idTask = doc._id.toString()
        return task
    }
    
    async erase(withS = true) {
        const db = Db.get(this.dbUri)
        await db.dropCollection(withS ? this.collection + 's' : this.collection)
        this.consoleLog.print('tasks erased')
    }

    async getById(id:string) {
        const Model = this.getModel()
        const doc = await Model.findById(id)
        return doc ? this.doc2persisted(doc) : null
    }

    async deleteById(id:string) {
        const Model = this.getModel()
        await Model.deleteOne({_id: new ObjectId(id)})
    }

    async findTasks(inputParams: Partial<TaskRunnerFindTasksParams>) {
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
        return taskDocs.map( taskDoc => this.doc2persisted(taskDoc) )
    }

    async loadTasks(tasksToLoad:number) {
        const Model = this.getModel()
        const queryObj = this.loadTasksQueryObj()

        let query = Model.find(queryObj).sort('-priority')
        if (tasksToLoad > 0) query = query.limit(tasksToLoad)
        const taskDocs = await query.exec()
        this.consoleLog.debug(`${ taskDocs.length } tasks loaded`)
        return taskDocs.map( taskDoc => this.doc2persisted(taskDoc) )
    }

    async saveTask(persistedTask:ITaskPersisted) {
        const Model = this.getModel()
        if (persistedTask.idTask) {
            const doc = await Model.findByIdAndUpdate(persistedTask.idTask, persistedTask, {
                returnDocument:'after',
                overwrite: true,
                upsert: true,
                new: true
            })
            persistedTask = this.doc2persisted(doc)
            this.consoleLog.debug(`task ${ persistedTaskTitle(persistedTask) } updated`)
            return persistedTask
        } else {
            const doc = new Model(persistedTask)
            await doc.save()
            persistedTask = this.doc2persisted(doc)
            this.consoleLog.debug(`new task ${ persistedTaskTitle(persistedTask) } saved`)
            return persistedTask
        }
    }

    async deleteTasksMarked() {
        const Model = this.getModel()
        const now = (new Date()).toISOString()
        const result = await Model.deleteMany({ deleteAt: { $lt: now } })
        this.consoleLog.debug(`${ result.deletedCount } tasks deleted`)
    }
}