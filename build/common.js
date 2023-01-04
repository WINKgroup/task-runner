"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmptyPersistedTask = void 0;
var uuid_1 = require("uuid");
function getEmptyPersistedTask() {
    var persistedTask = {
        persistedId: (0, uuid_1.v1)(),
        topic: 'default',
        createdAt: (new Date()).toISOString(),
        updatedAt: (new Date()).toISOString(),
        state: 'to do'
    };
    return persistedTask;
}
exports.getEmptyPersistedTask = getEmptyPersistedTask;
