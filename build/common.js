"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmptyTaskPersisted = exports.getEmptyInputTask = exports.persistedTaskTitle = void 0;
function persistedTaskTitle(persistedTask) {
    var title = persistedTask.topic ? persistedTask.topic : '';
    title += " (".concat(persistedTask.idTask, ")");
    return title;
}
exports.persistedTaskTitle = persistedTaskTitle;
function getEmptyInputTask() {
    var inputTask = {
        state: 'to do',
        createdAt: (new Date()).toISOString()
    };
}
exports.getEmptyInputTask = getEmptyInputTask;
function getEmptyTaskPersisted() {
    var taskPersisted = {
        idTask: undefined,
        state: 'to do',
        createdAt: (new Date()).toISOString(),
        updatedAt: (new Date()).toISOString()
    };
    return taskPersisted;
}
exports.getEmptyTaskPersisted = getEmptyTaskPersisted;
