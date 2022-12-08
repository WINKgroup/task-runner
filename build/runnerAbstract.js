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
var lodash_1 = __importDefault(require("lodash"));
var console_log_1 = __importDefault(require("@winkgroup/console-log"));
var TaskRunnerAbstract = /** @class */ (function () {
    function TaskRunnerAbstract(inputOptions) {
        this.consoleLog = new console_log_1.default({ prefix: 'Task Runner' });
        this.isActive = true;
        this._numOfRunningTasks = 0;
        this.topicFactory = {};
        this.options = lodash_1.default.defaults(inputOptions, {
            maxRunningTasks: 5,
            cronHz: 0
        });
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
    TaskRunnerAbstract.prototype.persistTask = function (task) {
        var factory = this.getFactory(task.topic);
        return factory ? factory.persist(task) : null;
    };
    TaskRunnerAbstract.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tasksToStart, persistedTasks, tasks;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isActive) {
                            this.consoleLog.debug('not active, run aborted');
                            return [2 /*return*/];
                        }
                        tasksToStart = this.options.maxRunningTasks - this._numOfRunningTasks;
                        this.consoleLog.debug("running tasks ".concat(this._numOfRunningTasks, "/").concat(this.options.maxRunningTasks));
                        if (!(tasksToStart > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.loadTasks(tasksToStart)];
                    case 1:
                        persistedTasks = _a.sent();
                        tasks = persistedTasks.map(function (persistedTask) { return _this.unpersistTask(persistedTask); });
                        tasks.map(function (task) {
                            if (task) {
                                ++_this._numOfRunningTasks;
                                task.addListener('ended', function () {
                                    --_this._numOfRunningTasks;
                                    _this.persistTask(task);
                                });
                                task.run();
                            }
                        });
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return TaskRunnerAbstract;
}());
exports.default = TaskRunnerAbstract;
