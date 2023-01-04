import mongoose, { Document } from 'mongoose';
import { IPersistedTask } from './common';
export interface ITaskDoc extends IPersistedTask, Document {
    title(): string;
}
export interface ITaskModel extends mongoose.Model<ITaskDoc> {
}
export declare const schema: mongoose.Schema<ITaskDoc, ITaskModel, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, ITaskDoc>;
