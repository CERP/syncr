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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sleep_1 = __importDefault(require("./sleep"));
const uuid_1 = require("uuid");
class Syncr {
    constructor(url) {
        this.url = url;
        this.ready = false;
        this.ws = undefined;
        this.pingInterval = undefined;
        this.message_timeout = 10000;
        this.connection_verified = false;
        this.pending = new Map(); // key: uuid, value: promise
        this.onEventFunctions = {
            'connect': [],
            'disconnect': [],
            'message': [],
            'verify': []
        };
        this.onNextEventFunctions = {
            'connect': [],
            'disconnect': [],
            'message': [],
            'verify': []
        };
        this.connect();
    }
    verify() {
        this.connection_verified = true;
        this.trigger('verify');
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ws = new WebSocket(this.url);
            this.ws.onopen = () => {
                this.ready = true;
                clearInterval(this.pingInterval);
                this.pingInterval = window.setInterval(() => this.ping(), 5000);
                this.trigger('connect');
            };
            this.ws.onclose = (e) => __awaiter(this, void 0, void 0, function* () {
                if (this.ready) {
                    this.pending.forEach(promise => promise.reject("disconnect"));
                    this.trigger('disconnect', e);
                }
                this.cleanup();
                yield sleep_1.default(9000 * Math.random() + 1000);
                this.connect();
            });
            this.ws.onerror = err => { }; //console.error("websocket err", err)
            this.ws.onmessage = event => {
                const msg = JSON.parse(event.data);
                console.log("<--- server", msg.type);
                if (msg.key) {
                    const promise = this.pending.get(msg.key);
                    if (promise === undefined) {
                        console.error("mesage not found in pending - will not process");
                        return;
                    }
                    if (msg.type === "failure") {
                        promise.reject(msg.payload);
                    }
                    else {
                        promise.resolve(msg.payload);
                    }
                    this.pending.delete(msg.key);
                }
                else {
                    this.trigger('message', msg);
                }
            };
        });
    }
    on(event, f) {
        this.onEventFunctions[event].push(f);
    }
    onNext(event, f) {
        this.onNextEventFunctions[event].push(f);
    }
    trigger(event, ...args) {
        this.onEventFunctions[event].forEach(f => f(...args));
        this.onNextEventFunctions[event].forEach(f => f(...args));
        this.onNextEventFunctions[event] = [];
    }
    cleanup() {
        this.ready = false;
        clearInterval(this.pingInterval);
        this.ws = undefined;
    }
    ping() {
        if (this.ready) {
            try {
                this.ws && this.ws.send("ping");
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    send(message, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ready) {
                throw new Error("not ready");
            }
            // make a key
            // create promise, put in map
            // when its returned, trigger it.
            console.log("server --->", message);
            const key = uuid_1.v4();
            return new Promise((resolve, reject) => {
                this.pending.set(key, { resolve, reject });
                if (!this.ws) {
                    reject("ws is undefined");
                }
                else {
                    this.ws.send(JSON.stringify({
                        key,
                        payload: message
                    }));
                }
                setTimeout(() => {
                    const p = this.pending.get(key);
                    if (p) {
                        console.log("MSG TIMEOUT!!!");
                        p.reject("timeout");
                    }
                    this.pending.delete(key);
                }, timeout || this.message_timeout);
            });
        });
    }
}
exports.default = Syncr;
