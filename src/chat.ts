import type * as Party from "partykit/server";
import { event, json, type Event } from './events';
import type { ConnectionState, Position } from "./types";
import { geocode } from "./api";

const FINGERPRINT_KEY = 'fp';
export default class Server implements Party.Server {
  static options = { hibernate: true };

  constructor(readonly room: Party.Room) {}

  async onConnect(
    conn: Party.Connection<ConnectionState>,
    ctx: Party.ConnectionContext
  ) {
    const id = conn.id;
    const { request } = ctx;
    const lat = parseFloat(request.cf!.latitude as string);
    const lng = parseFloat(request.cf!.longitude as string);

    const { data } = await geocode({ lat, lng });
    const { properties } = data.features.pop()
    const { country, region } = properties.context
    
    console.log('detected the following region', region);
    //TODO: add error handling for connections missing fingerprint
    const fingerprint = new URL(request.url).searchParams.get(FINGERPRINT_KEY)
    const connect_event = event<Position>("chat.join", { id, lat, lng, place: { country, region}, signature: fingerprint })

    console.log('connectiong establised to chat', connect_event);
    conn.setState(connect_event.data as Position);

    this.room.broadcast(json(connect_event))
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection<unknown>): void | Promise<void> {
    console.log('>>>>> got the following chat message', message, sender);
    const ev = JSON.parse(message as string) as Event<unknown>;
    //todo: check for profanity
    this.room.broadcast(message);
  }

  // Whenever a connection closes (or errors),
  // we'll broadcast a message to all other connections
  // to remove the marker
  onCloseOrError(connection: Party.Connection<unknown>) {
    this.room.broadcast(
      json(event('chat.leave', { id: connection.id!, name: 'Some Haitian' })),
      [connection.id]
    );
  }

  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
    this.onCloseOrError(connection);
  }

  onError(connection: Party.Connection<unknown>, error: Error): void | Promise<void>{
    this.onCloseOrError(connection);
  }
}

Server satisfies Party.Worker;
