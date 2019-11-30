declare type Event = "connect" | "disconnect";
export default class Syncr {
    url: string;
    ready: boolean;
    ws?: WebSocket;
    pingInterval?: number;
    dispatch: (action: any) => void;
    pending: Map<string, {
        resolve: (a: any) => any;
        reject: (a: any) => any;
    }>;
    message_timeout: number;
    private onEventFunctions;
    private onNextEventFunctions;
    constructor(url: string, dispatch: (action: any) => void);
    connect(): Promise<void>;
    on(event: Event, f: Function): void;
    onNext(event: Event, f: Function): void;
    cleanup(): void;
    ping(): void;
    send(message: any, timeout?: number): Promise<any>;
}
export {};
