import type * as Party from "partykit/server";
import { event, json, emit } from './events';
import type { ConnectionState, OutgoingMessage, Position } from "./types";

const FINGERPRINT_KEY = 'fp';
export default class Server implements Party.Server {
  // Let's use hibernation mode so we can scale to thousands of connections
  static options = { hibernate: true };

  // A no-op, but this assigns room to this.room (thanks typescript!)
  constructor(readonly room: Party.Room) {}

  onConnect(
    conn: Party.Connection<ConnectionState>,
    ctx: Party.ConnectionContext
  ) {
    const id = conn.id;
    const { request } = ctx;
    const lat = parseFloat(request.cf!.latitude as string);
    const lng = parseFloat(request.cf!.longitude as string);
    
    //TODO: add error handling for connections missing fingerprint
    const fingerprint = new URL(request.url).searchParams.get(FINGERPRINT_KEY)
    const connect_event = event<Position>("connection", { lat, lng, id, signature: fingerprint }, { cf: request.cf })

    conn.setState(connect_event.data as Position);
    emit(connect_event);

    // Now, let's send the entire state to the new connection
    for (const connection of this.room.getConnections<ConnectionState>()) {
      try {
        conn.send(json(event<Position>('add-marker', connection.state!)))
        // And let's send the new connection's position to all other connections
        if (connection.id !== conn.id) {
          connection.send(json(event<Position>('add-marker', conn.state!)))

        }
      } catch (err) {
        this.onCloseOrError(conn);
      }
    }
  }

  // Whenever a connection closes (or errors),
  // we'll broadcast a message to all other connections
  // to remove the marker
  onCloseOrError(connection: Party.Connection<unknown>) {
    this.room.broadcast(
      json(event('remove-marker', { id: connection.id! })),
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
