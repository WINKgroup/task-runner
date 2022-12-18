"use strict";
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
var common_1 = require("./common");
var lodash_1 = __importDefault(require("lodash"));
var console_log_1 = __importDefault(require("@winkgroup/console-log"));
var cron_1 = __importDefault(require("@winkgroup/cron"));
var TaskRunnerAbstract = /** @class */ (function () {
    function TaskRunnerAbstract(inputOptions) {
        this.consoleLog = new console_log_1.default({ prefix: 'Task Runner' });
        this.isActive = true;
        this._numOfRunningTasks = 0;
        this.topicFactory = {};
        var options = lodash_1.default.defaults(inputOptions, {
            maxRunningTasks: 5,
            cronHz: 0,
            instance: 'default'
        });
        this.maxRunningTasks = options.maxRunningTasks;
        this.instance = options.instance;
        this.cronObj = new cron_1.default(options.cronHz, this.consoleLog);
    }
    Object.defineProperty(TaskRunnerAbstract.prototype, "active", {
        get: function () { return this.isActive; },
        set: function (isActive) {
            if (isActive && !this.isActive)
                this.run();
            this.isActive = isActive;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TaskRunnerAbstract.prototype, "numOfRunningTasks", {
        get: function () { return this._numOfRunningTasks; },
        enumerable: false,
        configurable: true
    });
    TaskRunnerAbstract.prototype.loadTasksQueryObj = function () {
        var topics = Object.keys(this.topicFactory);
        var now = (new Date()).toISOString();
        var queryObj = {
            state: 'to do',
            worker: { $exists: false },
            $or: [
                { waitUntil: { $exists: false } },
                { waitUntil: { $lte: now } }
            ]
        };
        if (topics.indexOf('') !== -1) {
            if (topics.length > 1)
                throw new Error('topic empty should be used alone');
            queryObj['topic'] = { $exists: false };
        }
        else {
            queryObj['topic'] = { $in: topics };
        }
        return queryObj;
    };
    TaskRunnerAbstract.prototype.registerFactory = function (topic, factory) {
        this.topicFactory[topic] = factory;
        this.consoleLog.print("new factory registered for topic \"".concat(topic, "\""));
    };
    TaskRunnerAbstract.prototype.getFactory = function (topic) {
        try {
            if (!topic) {
                var topicFactoryList = Object.values(this.topicFactory);
                if (topicFactoryList.length === 0)
                    throw new Error('no topic factory registered');
                return topicFactoryList[0];
            }
            else {
                var factory = this.topicFactory[topic];
                if (!factory)
                    throw new Error("no factory registered for topic \"".concat(topic, "\""));
                return factory;
            }
        }
        catch (e) {
            this.consoleLog.error(e);
            return null;
        }
    };
    TaskRunnerAbstract.prototype.unpersistTask = function (persistedTask) {
        var factory = this.getFactory(persistedTask.topic);
        return factory ? factory.unpersist(persistedTask) : null;
    };
    TaskRunnerAbstract.prototype.persistTask = function (task, save) {
        if (save === void 0) { save = true; }
        return __awaiter(this, void 0, void 0, function () {
            var factory, persistedTask, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        factory = this.getFactory(task.topic);
                        if (!factory)
                            throw new Error("unable to save task ".concat(task.title()));
                        persistedTask = factory.persist(task);
                        if (!save)
                            return [2 /*return*/, persistedTask];
                        return [4 /*yield*/, this.saveTask(persistedTask)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.lockTask = function (persistedTask) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        persistedTask.worker = this.instance;
                        return [4 /*yield*/, this.saveTask(persistedTask)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, !!result];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.retrieveTasksAndLock = function (tasksToStart) {
        return __awaiter(this, void 0, void 0, function () {
            var tasks, persistedTasks, _i, persistedTasks_1, persistedTask, task, locked;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tasks = [];
                        if (tasksToStart <= 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.loadTasks(tasksToStart)];
                    case 1:
                        persistedTasks = _a.sent();
                        _i = 0, persistedTasks_1 = persistedTasks;
                        _a.label = 2;
                    case 2:
                        if (!(_i < persistedTasks_1.length)) return [3 /*break*/, 5];
                        persistedTask = persistedTasks_1[_i];
                        task = this.unpersistTask(persistedTask);
                        if (!task)
                            return [3 /*break*/, 4];
                        return [4 /*yield*/, this.lockTask(persistedTask)];
                    case 3:
                        locked = _a.sent();
                        if (!locked) {
                            this.consoleLog.debug("unable to lock task ".concat((0, common_1.persistedTaskTitle)(persistedTask)));
                            return [3 /*break*/, 4];
                        }
                        else
                            this.consoleLog.debug("task ".concat((0, common_1.persistedTaskTitle)(persistedTask), " locked"));
                        tasks.push(task);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, tasks];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.runTask = function (task) {
        var _this = this;
        ++this._numOfRunningTasks;
        this.consoleLog.debug("running task ".concat(task.title()));
        task.addListener('ended', function () { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        --this._numOfRunningTasks;
                        task.worker = undefined;
                        this.consoleLog.debug("unlocking task ".concat(task.title()));
                        return [4 /*yield*/, this.persistTask(task)];
                    case 1:
                        result = _a.sent();
                        if (!result)
                            this.consoleLog.error("unable to persist task ".concat(task.title()));
                        return [2 /*return*/];
                }
            });
        }); });
        this.consoleLog.print("running task ".concat(task.id, "..."));
        return task.run();
    };
    TaskRunnerAbstract.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var numOfFactories, tasksToStart, tasks;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isActive) {
                            this.consoleLog.debug('not active, run aborted');
                            return [2 /*return*/];
                        }
                        numOfFactories = Object.values(this.topicFactory).length;
                        if (numOfFactories === 0)
                            this.consoleLog.warn('no factory registered, likely no task will be run');
                        tasksToStart = this.maxRunningTasks - this._numOfRunningTasks;
                        this.consoleLog.debug("running tasks ".concat(this._numOfRunningTasks, "/").concat(this.maxRunningTasks));
                        return [4 /*yield*/, this.retrieveTasksAndLock(tasksToStart)];
                    case 1:
                        tasks = _a.sent();
                        tasks.map(function (task) { return _this.runTask(task); });
                        return [2 /*return*/];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.cron = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.cronObj.tryStartRun())
                            return [2 /*return*/];
                        return [4 /*yield*/, this.run()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.deleteTasksMarked()];
                    case 2:
                        _a.sent();
                        this.cronObj.runCompleted();
                        return [2 /*return*/];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.shutdown = function () {
        var _this = this;
        this.isActive = false;
        return new Promise(function (resolve) {
            var intervalFunc = setInterval(function () {
                _this.isActive = false;
                if (_this._numOfRunningTasks === 0) {
                    clearInterval(intervalFunc);
                    resolve();
                }
            }, 1000);
        });
    };
    return TaskRunnerAbstract;
}());
exports.default = TaskRunnerAbstract;
