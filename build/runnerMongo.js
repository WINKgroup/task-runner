"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var db_mongo_1 = __importDefault(require("@winkgroup/db-mongo"));
var lodash_1 = __importDefault(require("lodash"));
var common_1 = require("./common");
var modelTaskPersisted_1 = require("./modelTaskPersisted");
var runnerAbstract_1 = __importDefault(require("./runnerAbstract"));
var TaskRunnerMongo = /** @class */ (function (_super) {
    __extends(TaskRunnerMongo, _super);
    function TaskRunnerMongo(dbUri, inputOptions) {
        var _this = this;
        var options = lodash_1.default.defaults(inputOptions, { collection: 'task' });
        _this = _super.call(this, options) || this;
        _this.dbUri = dbUri;
        _this.collection = options.collection;
        return _this;
    }
    TaskRunnerMongo.prototype.getModel = function () {
        var db = db_mongo_1.default.get(this.dbUri);
        return db.model(this.collection, modelTaskPersisted_1.schema);
    };
    TaskRunnerMongo.prototype.doc2persisted = function (doc) {
        var task = doc.toObject();
        task.idTask = doc._id.toString();
        return task;
    };
    TaskRunnerMongo.prototype.erase = function (withS) {
        if (withS === void 0) { withS = true; }
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = db_mongo_1.default.get(this.dbUri);
                        return [4 /*yield*/, db.dropCollection(withS ? this.collection + 's' : this.collection)];
                    case 1:
                        _a.sent();
                        this.consoleLog.print('tasks erased');
                        return [2 /*return*/];
                }
            });
        });
    };
    TaskRunnerMongo.prototype.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var Model, doc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Model = this.getModel();
                        return [4 /*yield*/, Model.findById(id)];
                    case 1:
                        doc = _a.sent();
                        return [2 /*return*/, doc ? this.doc2persisted(doc) : null];
                }
            });
        });
    };
    TaskRunnerMongo.prototype.findTasks = function (inputParams) {
        return __awaiter(this, void 0, void 0, function () {
            var Model, params, query, taskDocs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Model = this.getModel();
                        params = lodash_1.default.defaults(inputParams, {
                            queryObj: {},
                            limit: 0,
                            skip: 0,
                            sort: ''
                        });
                        query = Model.find(params.queryObj);
                        if (params.limit)
                            query = query.limit(params.limit);
                        if (params.skip)
                            query = query.skip(params.skip);
                        if (params.sort)
                            query = query.sort(params.sort);
                        return [4 /*yield*/, query.exec()];
                    case 1:
                        taskDocs = _a.sent();
                        this.consoleLog.debug("".concat(taskDocs.length, " tasks found"));
                        return [2 /*return*/, taskDocs.map(function (taskDoc) { return _this.doc2persisted(taskDoc); })];
                }
            });
        });
    };
    TaskRunnerMongo.prototype.loadTasks = function (tasksToLoad) {
        return __awaiter(this, void 0, void 0, function () {
            var Model, queryObj, query, taskDocs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Model = this.getModel();
                        queryObj = this.loadTasksQueryObj();
                        query = Model.find(queryObj).sort('-priority');
                        if (tasksToLoad > 0)
                            query = query.limit(tasksToLoad);
                        return [4 /*yield*/, query.exec()];
                    case 1:
                        taskDocs = _a.sent();
                        this.consoleLog.debug("".concat(taskDocs.length, " tasks loaded"));
                        return [2 /*return*/, taskDocs.map(function (taskDoc) { return _this.doc2persisted(taskDoc); })];
                }
            });
        });
    };
    TaskRunnerMongo.prototype.saveTask = function (persistedTask) {
        return __awaiter(this, void 0, void 0, function () {
            var Model, doc, doc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Model = this.getModel();
                        if (!persistedTask.idTask) return [3 /*break*/, 2];
                        return [4 /*yield*/, Model.findByIdAndUpdate(persistedTask.idTask, persistedTask, {
                                returnDocument: 'after',
                                overwrite: true,
                                upsert: true,
                                new: true
                            })];
                    case 1:
                        doc = _a.sent();
                        persistedTask = this.doc2persisted(doc);
                        this.consoleLog.debug("task ".concat((0, common_1.persistedTaskTitle)(persistedTask), " updated"));
                        return [2 /*return*/, persistedTask];
                    case 2:
                        doc = new Model(persistedTask);
                        return [4 /*yield*/, doc.save()];
                    case 3:
                        _a.sent();
                        persistedTask = this.doc2persisted(doc);
                        this.consoleLog.debug("new task ".concat((0, common_1.persistedTaskTitle)(persistedTask), " saved"));
                        return [2 /*return*/, persistedTask];
                }
            });
        });
    };
    TaskRunnerMongo.prototype.deleteTasksMarked = function () {
        return __awaiter(this, void 0, void 0, function () {
            var Model, now, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Model = this.getModel();
                        now = (new Date()).toISOString();
                        return [4 /*yield*/, Model.deleteMany({ deleteAt: { $lt: now } })];
                    case 1:
                        result = _a.sent();
                        this.consoleLog.debug("".concat(result.deletedCount, " tasks deleted"));
                        return [2 /*return*/];
                }
            });
        });
    };
    return TaskRunnerMongo;
}(runnerAbstract_1.default));
exports.default = TaskRunnerMongo;
