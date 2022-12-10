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
var console_log_1 = __importDefault(require("@winkgroup/console-log"));
var lodash_1 = __importDefault(require("lodash"));
var node_events_1 = require("node:events");
var cron_1 = __importDefault(require("@winkgroup/cron"));
var Task = /** @class */ (function (_super) {
    __extends(Task, _super);
    function Task(inputOptions) {
        var _this = _super.call(this) || this;
        _this.running = false;
        _this._response = undefined;
        _this.consoleLog = new console_log_1.default({ prefix: 'Task' });
        var options = lodash_1.default.defaults(inputOptions, {
            state: 'to do',
            topic: '',
            priority: 0,
            createdAt: (new Date()).toISOString()
        });
        _this._id = options.id;
        _this._state = options.state;
        _this._topic = options.topic;
        _this.data = options.data;
        _this._response = options.response;
        _this.priority = options.priority;
        _this.applicant = options.applicant;
        _this.worker = options.worker;
        _this.createdAt = options.createdAt;
        _this.deleteAt = options.deleteAt;
        _this.waitUntil = options.waitUntil;
        return _this;
    }
    Object.defineProperty(Task.prototype, "id", {
        get: function () { return this._id; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "state", {
        get: function () { return this._state; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "topic", {
        get: function () { return this._topic; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "isRunning", {
        get: function () { return this.running; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "response", {
        get: function () { return this._response; },
        enumerable: false,
        configurable: true
    });
    Task.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.running) {
                            this.consoleLog.warn('already running');
                            return [2 /*return*/];
                        }
                        this.running = true;
                        this._response = undefined;
                        this.emit('started');
                        return [4 /*yield*/, this._run()];
                    case 1:
                        _a.sent();
                        this.emit('ended', this._response);
                        this.running = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    Task.prototype.unpersistHelper = function (taskPersisted) {
        this._id = taskPersisted.idTask;
        this._topic = taskPersisted.topic ? taskPersisted.topic : '';
        this.data = taskPersisted.data;
        this._response = taskPersisted.response;
        this.priority = taskPersisted.priority ? taskPersisted.priority : 0;
        this.applicant = taskPersisted.applicant;
        this.worker = taskPersisted.worker;
        this.createdAt = taskPersisted.createdAt;
        this.deleteAt = taskPersisted.deleteAt;
        this.waitUntil = taskPersisted.waitUntil;
    };
    Task.prototype.title = function () {
        var title = this._topic;
        if (this._id)
            title += " (".concat(this._id, ")");
        return title;
    };
    Task.prototype.setCompleted = function (millisecondsForDeletion) {
        if (millisecondsForDeletion === void 0) { millisecondsForDeletion = 30000; }
        this._state = 'completed';
        this.deleteAt = cron_1.default.comeBackIn(millisecondsForDeletion);
    };
    return Task;
}(node_events_1.EventEmitter));
exports.default = Task;
