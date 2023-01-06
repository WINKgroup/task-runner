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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var console_log_1 = __importDefault(require("@winkgroup/console-log"));
var cron_1 = __importDefault(require("@winkgroup/cron"));
var lodash_1 = __importDefault(require("lodash"));
var node_events_1 = require("node:events");
var common_1 = require("./common");
var TaskRunnerAbstract = /** @class */ (function (_super) {
    __extends(TaskRunnerAbstract, _super);
    function TaskRunnerAbstract(inputOptions) {
        var _this = _super.call(this) || this;
        _this.topicFactory = {};
        _this._setup = false;
        _this._persistedTasks = {};
        var options = lodash_1.default.defaults(inputOptions, {
            instance: 'default',
            everySeconds: 0,
            maxRunningTasks: 5,
            startActive: true,
            consoleLog: new console_log_1.default({ prefix: 'Task Runner' }),
            housekeeperEverySeconds: 10 * 60
        });
        _this.instance = options.instance;
        _this.cronObj = new cron_1.default(options.everySeconds, options.consoleLog);
        _this.maxRunningTasks = options.maxRunningTasks;
        _this._active = options.startActive;
        _this.consoleLog = options.consoleLog;
        _this.io = options.ioNamespace;
        _this.houseKeeperCronObj = new cron_1.default(options.housekeeperEverySeconds, options.consoleLog);
        _this.setIo();
        return _this;
    }
    Object.defineProperty(TaskRunnerAbstract.prototype, "active", {
        get: function () { return this._active; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TaskRunnerAbstract.prototype, "list", {
        get: function () { return Object.values(this._persistedTasks); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TaskRunnerAbstract.prototype, "taskIds", {
        get: function () { return Object.keys(this._persistedTasks); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TaskRunnerAbstract.prototype, "numOfRunningTasks", {
        get: function () { return Object.keys(this._persistedTasks).length; },
        enumerable: false,
        configurable: true
    });
    TaskRunnerAbstract.prototype.start = function () {
        var needsRun = !this._active;
        this._active = true;
        if (needsRun)
            this.run();
    };
    TaskRunnerAbstract.prototype.stop = function (force) {
        if (force === void 0) { force = false; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._active)
                            return [2 /*return*/];
                        this._active = false;
                        return [4 /*yield*/, Promise.all(this.list.map(function (persistedTask) {
                                var task = _this.unpersistTask(persistedTask);
                                if (force && task.stop) {
                                    return task.stop();
                                }
                                else {
                                    if (force)
                                        _this.consoleLog.warn("unable to perform \"force\" option since task ".concat(persistedTask.persistedId, " has no stop method"));
                                    var waitForEnd = function () { return new Promise(function (resolve) {
                                        task.on('ended', resolve);
                                    }); };
                                    return waitForEnd;
                                }
                            }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.loadTasksQueryObj = function () {
        var topics = Object.keys(this.topicFactory);
        var now = (new Date()).toISOString();
        var queryObj = {
            state: 'to do',
            topic: { $in: topics },
            worker: { $exists: false },
            $or: [
                { waitUntil: { $exists: false } },
                { waitUntil: { $lte: now } }
            ]
        };
        return queryObj;
    };
    TaskRunnerAbstract.prototype.registerFactory = function (factory, topic) {
        if (topic === void 0) { topic = 'default'; }
        this.topicFactory[topic] = factory;
        this.consoleLog.print("new factory registered for topic \"".concat(topic, "\""));
    };
    TaskRunnerAbstract.prototype.getFactory = function (topic) {
        if (topic === void 0) { topic = 'default'; }
        var factory = this.topicFactory[topic];
        if (!factory)
            throw new Error("no factory registered for topic \"".concat(topic, "\""));
        return factory;
    };
    TaskRunnerAbstract.prototype.unpersistTask = function (persistedTask) {
        var factory = this.getFactory(persistedTask.topic);
        return factory.unpersist(persistedTask);
    };
    TaskRunnerAbstract.prototype.createPersistedTask = function (inputTask, save) {
        if (save === void 0) { save = false; }
        return __awaiter(this, void 0, void 0, function () {
            var persistedTask;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        persistedTask = lodash_1.default.defaults(inputTask, __assign(__assign({}, (0, common_1.getEmptyPersistedTask)()), { applicant: this.instance }));
                        if (!save) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.savePersistedTask(persistedTask)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.persistTask = function (task, topic, inputOptions, save) {
        if (save === void 0) { save = false; }
        return __awaiter(this, void 0, void 0, function () {
            var options, persistedTask;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, { applicant: this.instance });
                        persistedTask = task.persist(topic, options);
                        if (!save) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.savePersistedTask(persistedTask)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, persistedTask];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.lockPersistedTask = function (persistedTask) {
        return __awaiter(this, void 0, void 0, function () {
            var id, isLocked;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = persistedTask.persistedId;
                        if (persistedTask.worker) {
                            this.consoleLog.warn("task ".concat(id, " already running at ").concat(persistedTask.worker, ", not running it again"));
                            return [2 /*return*/];
                        }
                        persistedTask.worker = this.instance;
                        return [4 /*yield*/, this.savePersistedTask(persistedTask)];
                    case 1:
                        isLocked = _a.sent();
                        if (!isLocked) {
                            this.consoleLog.warn("unable to lock task ".concat(id));
                            delete persistedTask.worker;
                        }
                        else
                            this.consoleLog.debug("task ".concat(id, " locked"));
                        return [2 /*return*/, isLocked];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.runPersistedTask = function (persistedTask, inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, id, _a, task;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, {
                            lockTask: true,
                            forceRunning: false
                        });
                        id = persistedTask.persistedId;
                        if (!options.forceRunning && persistedTask.state === 'completed') {
                            this.consoleLog.warn("task ".concat(id, " already completed: not running it again"));
                            return [2 /*return*/];
                        }
                        _a = options.lockTask;
                        if (!_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.lockPersistedTask(persistedTask)];
                    case 1:
                        _a = !(_b.sent());
                        _b.label = 2;
                    case 2:
                        if (_a)
                            return [2 /*return*/];
                        this._persistedTasks[id] = persistedTask;
                        this.consoleLog.debug("running task ".concat(id, "..."));
                        task = this.unpersistTask(persistedTask);
                        task.consoleLog.generalOptions.verbosity = this.consoleLog.generalOptions.verbosity;
                        return [4 /*yield*/, task.run()];
                    case 3:
                        _b.sent();
                        persistedTask = task.persist(persistedTask.topic, {
                            persistedId: id,
                            createdAt: persistedTask.createdAt,
                            applicant: persistedTask.applicant
                        });
                        if (options.lockTask)
                            delete persistedTask.worker;
                        return [4 /*yield*/, this.savePersistedTask(persistedTask)];
                    case 4:
                        _b.sent();
                        delete this._persistedTasks[persistedTask.persistedId];
                        return [2 /*return*/];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tasksToStart, numOfFactories, persistedTasks;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._active) {
                            this.consoleLog.debug('not active, run aborted');
                            return [2 /*return*/];
                        }
                        tasksToStart = this.maxRunningTasks - this.numOfRunningTasks;
                        this.consoleLog.debug("running tasks ".concat(this.numOfRunningTasks, "/").concat(this.maxRunningTasks));
                        if (tasksToStart <= 0)
                            return [2 /*return*/];
                        numOfFactories = Object.values(this.topicFactory).length;
                        if (numOfFactories === 0)
                            this.consoleLog.warn('no factory registered, likely no task will be run');
                        return [4 /*yield*/, this.loadTasks(tasksToStart)];
                    case 1:
                        persistedTasks = _a.sent();
                        persistedTasks.map(function (persistedTask) { return _this.runPersistedTask(persistedTask); });
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
                        if (!this.cronObj.tryStartRun()) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.run()];
                    case 1:
                        _a.sent();
                        this.cronObj.runCompleted();
                        _a.label = 2;
                    case 2:
                        if (!this.houseKeeperCronObj.tryStartRun()) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.deletePersistedTasksMarked()];
                    case 3:
                        _a.sent();
                        this.houseKeeperCronObj.runCompleted();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TaskRunnerAbstract.prototype.isIoTokenValid = function (token) {
        return true;
    };
    TaskRunnerAbstract.prototype.setIo = function () {
        var _this = this;
        if (!this.io)
            return;
        this.io.use(function (socket, next) {
            var token = socket.handshake.auth.token;
            if (!_this.isIoTokenValid(token))
                next(new Error('access denied'));
            else
                next();
        });
        this.io.on('connection', function (socket) {
            _this.consoleLog.debug('client connected');
            socket.on('start', function () { _this._active = true; });
            socket.on('stop', function (force) { return _this.stop(force); });
        });
    };
    return TaskRunnerAbstract;
}(node_events_1.EventEmitter));
exports.default = TaskRunnerAbstract;
