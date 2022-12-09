import mongoose, { Document } from 'mongoose'
import { ITaskPersisted } from './common'

export interface ITaskDoc extends ITaskPersisted, Document {
    title(): string
}

export interface ITaskModel extends mongoose.Model<ITaskDoc> {
}

export const schema = new mongoose.Schema<ITaskDoc, ITaskModel>({
    state: {type: String, enum: ['to do', 'completed'], default: 'to do'},
    topic: String,
    data: mongoose.Schema.Types.Mixed,
    response: mongoose.Schema.Types.Mixed,
    priority: Number,
    applicant: String,
    worker: String,
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    deleteAt: String,
    waitUntil: String
})

schema.methods.title = async function() {
    const task = this as ITaskDoc
    let title = task.topic
    if (this.idTask) title += ` (${ this.idTask })`

    return title
}