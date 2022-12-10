"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistedTaskTitle = void 0;
function persistedTaskTitle(persistedTask) {
    var title = persistedTask.topic ? persistedTask.topic : '';
    title += " (".concat(persistedTask.idTask, ")");
    return title;
}
exports.persistedTaskTitle = persistedTaskTitle;
