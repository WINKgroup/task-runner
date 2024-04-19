import mongoose, { HydratedDocument, Model } from 'mongoose';
import { IPersistedTask, PersistedTaskWithId } from './common';

export interface ITaskMethods {
    title(): string;
    toPersistedWithId(): PersistedTaskWithId;
    updateData(data: Partial<PersistedTaskWithId>): void;
}

export type TaskDoc = HydratedDocument<IPersistedTask, ITaskMethods>;

export interface TaskModel extends Model<IPersistedTask, {}, ITaskMethods> {
    createEmpty(versionedTopic?: string): TaskDoc;
}

export const schema = new mongoose.Schema<TaskDoc, TaskModel>({
    state: {
        type: String,
        enum: ['to do', 'running', 'paused', 'completed'],
        default: 'to do',
    },
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
    },
});

schema.method('toPersistedWithId', function () {
    const doc = this as TaskDoc;
    const obj: PersistedTaskWithId = doc.toObject({
        versionKey: false,
        flattenObjectIds: true,
    });
    return obj;
});

schema.method('title', async function () {
    let title: string = this.versionedTopic + ` (${this._id})`;
    return title;
});

schema.method('updateData', function (data: Partial<PersistedTaskWithId>) {
    const doc = this as TaskDoc;
    if (!data.updatedAt) data.updatedAt = new Date().toISOString();
    for (const key in data) {
        if (['id', 'versionedTopic'].indexOf(key) !== -1) continue;
        // @ts-ignore
        doc[key] = data[key];
    }
});

schema.static('createEmpty', function (versionedTopic = 'default#1') {
    const Model = this as TaskModel;

    return new Model({
        versionedTopic: versionedTopic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
});
