import Db from "@winkgroup/db-mongo"
import _ from "lodash"
import { ITaskPersisted, TaskRunnerMongoOptions } from "./common"
import { ITaskDoc, ITaskModel, schema } from "./modelTaskPersisted"
import TaskRunnerAbstract from "./runnerAbstract"

export default class TaskRunnerMongo extends TaskRunnerAbstract {
    dbUri:string
    collection:string

    constructor(dbUri:string, inputOptions?:TaskRunnerMongoOptions) {
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
    }

    async loadTasks(tasksToLoad:number) {
        const topics = Object.keys(this.topicFactory)
        const Model = this.getModel()
        let query = Model.find({topic: {$in: topics} }).sort('-priority')
        if (tasksToLoad > 0) query = query.limit(tasksToLoad)
        const tasks = await query.exec()
        return tasks
    }

    async upsertTask(taskPersisted: Partial<ITaskPersisted>) {
        const Model = this.getModel()
        const doc = new Model(taskPersisted)
        await doc.save()
        return doc
    }
}