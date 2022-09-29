import sleep from "./sleep";
import { v4 as uuid4 } from "uuid";

type Event = "connect" | "disconnect" | "message" | "verify";

export default class Syncr {
  url: string;
  ready: boolean;
  ws?: WebSocket;
  pingInterval?: number;
  pending: Map<string, { resolve: (a: any) => any; reject: (a: any) => any }>;
  message_timeout: number;
  connection_verified: boolean;

  private onEventFunctions: Record<Event, Function[]>;
  private onNextEventFunctions: Record<Event, Function[]>;

  constructor(url: string) {
    this.url = url;
    this.ready = false;
    this.ws = undefined;
    this.pingInterval = undefined;
    this.message_timeout = 10000;
    this.connection_verified = false;

    this.pending = new Map(); // key: uuid, value: promise

    this.onEventFunctions = {
      connect: [],
      disconnect: [],
      message: [],
      verify: [],
    };
    this.onNextEventFunctions = {
      connect: [],
      disconnect: [],
      message: [],
      verify: [],
    };

    this.connect();
  }

  public verify() {
    this.connection_verified = true;

    this.trigger("verify");
  }

  async connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.ready = true;
      clearInterval(this.pingInterval);
      this.pingInterval = window.setInterval(() => this.ping(), 5000);

      this.trigger("connect");
    };

    this.ws.onclose = async (e) => {
      if (this.ready) {
        this.pending.forEach((promise) => promise.reject("disconnect"));

        this.trigger("disconnect", e);
      }

      this.connection_verified = false;
      this.cleanup();
      await sleep(9000 * Math.random() + 1000);
      this.connect();
    };

    this.ws.onerror = (err) => {}; //console.error("websocket err", err)

    this.ws.onmessage = (event) => {
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
        } else {
          promise.resolve(msg.payload);
        }
        this.pending.delete(msg.key);
      } else {
        this.trigger("message", msg);
      }
    };
  }

  on(event: Event, f: Function) {
    this.onEventFunctions[event].push(f);
  }

  onNext(event: Event, f: Function) {
    this.onNextEventFunctions[event].push(f);
  }

  private trigger(event: Event, ...args: any[]) {
    this.onEventFunctions[event].forEach((f) => f(...args));

    this.onNextEventFunctions[event].forEach((f) => f(...args));
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
      } catch (e) {
        console.error(e);
      }
    }
  }

  async send(message: any, timeout?: number) {
    if (!this.ready) {
      throw new Error("not ready");
    }

    // make a key
    // create promise, put in map
    // when its returned, trigger it.
    console.log("server --->", message);
    const key = uuid4();
    return new Promise<any>((resolve, reject) => {
      this.pending.set(key, { resolve, reject });

      if (!this.ws) {
        reject("ws is undefined");
      } else {
        this.ws.send(
          JSON.stringify({
            key,
            payload: message,
          })
        );
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
  }
}
