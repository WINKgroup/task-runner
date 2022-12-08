"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
exports.schema = new mongoose_1.default.Schema({
    state: { type: String, enum: ['to do', 'completed'], default: 'to do' },
    topic: String,
    data: mongoose_1.default.Schema.Types.Mixed,
    response: mongoose_1.default.Schema.Types.Mixed,
    priority: Number,
    applicant: String,
    worker: String,
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    waitUntil: String
});
