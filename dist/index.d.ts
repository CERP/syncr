declare type Event = "connect" | "disconnect" | "message";
export default class Syncr {
    url: string;
    ready: boolean;
    ws?: WebSocket;
    pingInterval?: number;
    pending: Map<string, {
        resolve: (a: any) => any;
        reject: (a: any) => any;
    }>;
    message_timeout: number;
    private onEventFunctions;
    private onNextEventFunctions;
    constructor(url: string);
    connect(): Promise<void>;
    on(event: Event, f: Function): void;
    onNext(event: Event, f: Function): void;
    private trigger;
    cleanup(): void;
    ping(): void;
    send(message: any, timeout?: number): Promise<any>;
}
export {};
