"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TaskFactory = /** @class */ (function () {
    function TaskFactory() {
    }
    TaskFactory.prototype.persist = function (task) {
        var taskPersisted = {
            idTask: task.id,
            state: task.state,
            createdAt: task.createdAt,
            updatedAt: (new Date()).toISOString()
        };
        if (task.topic)
            taskPersisted.topic = task.topic;
        if (task.data)
            taskPersisted.data = task.data;
        if (task.response)
            taskPersisted.response = task.response;
        if (task.priority)
            taskPersisted.priority = task.priority;
        if (task.applicant)
            taskPersisted.applicant = task.applicant;
        if (task.worker)
            taskPersisted.worker = task.worker;
        if (task.deleteAt)
            taskPersisted.deleteAt = task.deleteAt;
        if (task.waitUntil)
            taskPersisted.waitUntil = task.waitUntil;
        return taskPersisted;
    };
    return TaskFactory;
}());
exports.default = TaskFactory;
