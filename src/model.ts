import mongoose, { Document, ObjectId } from 'mongoose';
import { IPersistedTask, PersistedTaskWithId, SerializedTask } from './common';

export interface ITaskDoc extends IPersistedTask, Document {
    title(): string;
    toPersistedWithId(): PersistedTaskWithId
    updateData(data:Partial<PersistedTaskWithId>): void
}

export interface ITaskModel extends mongoose.Model<ITaskDoc> {
    createEmpty(versionedTopic?:string): ITaskDoc
}

export const schema = new mongoose.Schema<ITaskDoc, ITaskModel>({
    state: { type: String, enum: ['to do', 'running', 'paused', 'completed'], default: 'to do' },
    versionedTopic: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed,
    response: mongoose.Schema.Types.Mixed,
    priority: Number,
    applicant: String,
    worker: String,
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    deleteAt: String,
    waitUntil: String,
    publicUrl: String,
    availableActions: {
        stop: Boolean,
        pause: Boolean,
        resume: Boolean,
        recover: Boolean
    }
});

schema.method('toPersistedWithId', function() {
    const doc = this as ITaskDoc;
    const obj = doc.toObject({versionKey: false})
    if (typeof obj.id !== 'string') obj.id = (obj._id as ObjectId).toString()
    delete obj._id
    return obj
})

schema.method('title', async function () {
    const doc = this as ITaskDoc;
    let title = doc.versionedTopic + ` (${doc._id})`;

    return title;
})

schema.method('updateData', function(data:Partial<PersistedTaskWithId>) {
    const doc = this as ITaskDoc;
    for( const key in data) {
        if (['id', 'versionedTopic'].indexOf(key) !== -1) continue
        // @ts-ignore
        doc[key] = data[key]
    }   
})

schema.static('createEmpty', function (versionedTopic = 'default#1') {
    const Model = this as ITaskModel

    return new Model({
        versionedTopic: versionedTopic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    })
})