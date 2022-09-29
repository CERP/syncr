# Syncr

a bulletproof WebSocket API wrapper for creating and managing WebSocket connection to a server

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
<a aria-label="Package size" href="https://bundlephobia.com/result?p=@cerp/syncr">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/@cerp/syncr">
</a>


## Install

Install with npm or yarn via

```
yarn add @cerp/syncr@1.1.2
```

or

```
npm i @cerp/syncr@1.1.2
```

## API

```ts
type Event = "connect" | "disconnect" | "message" | "verify"
interface Syncr {
    url: string
    ready: boolean
    ws?: WebSocket
    pingInterval?: number
    pending: Map<string, {
        resolve: (a: any) => any
        reject: (a: any) => any
    }>
    message_timeout: number
    connection_verified: boolean
    verify(): void
    connect(): Promise<void>
    on(event: Event, f: Function): void
    onNext(event: Event, f: Function): void
    cleanup(): void
    ping(): void
    send(message: any, timeout?: number): Promise<any>
}
```

## Usage

- Use `syncr` with events

  ```ts
  import Syncr from '@cerp/syncr'

  const syncr = new Syncr("wss://example.com/ws")

  // on connected to server
  syncr.on('connect', () => console.log("connected to a server"))

  // on disconnected from a server
  syncr.on('disconnect', () => console.log("disconnected from a server"))

  // on receiving a new message from server
  syncr.on('message', (message: any) => console.log("new message", message))

  // on verify a connection to server
  syncr.on('verify', () => console.log("connection is verified"))
  ```

- Make a request to server using `Syncr.Send()` with `Promise`

  ```ts
  import Syncr from '@cerp/syncr'
  export const startService = () => {
    const syncr = new Syncr("wss://example.com/ws")

    syncr.send({
      type: "START_SERVICE",
      client_type: "Labs"
      payload: {
        initiator_id: "xxxx-xxxx"
        req_token: "xxxx-xxxx"
        req_timeout: 5000
      }
    })
      .then(response => {
        // do something here
      })
      .catch(error => {
        // do something here
      })
  }
  ```

  `OR with async arrow style`

  ```ts
  import Syncr from '@cerp/syncr'

  export const startService = aysnc () => {
    const syncr = new Syncr("wss://example.com/ws")

    try {
      const response = await syncr.send({
        type: "START_SERVICE",
        client: "Labs",
        payload: {
          initiator_id: "xxxx-xxxx"
          req_token: "xxxx-xxxx"
          req_timeout: 5000
        }
      })
  
      // do something with reponse here

    } catch(error) {
      // do something with error here
    }
  }
  ```