import type * as Party from "partykit/server";
import { event, json, emit, Event } from './events';
import type { ConnectionState, OutgoingMessage, Position } from "./types";
import { geocode } from "./api";

const FINGERPRINT_KEY = 'fp';
export default class Server implements Party.Server {
  // Let's use hibernation mode so we can scale to thousands of connections
  static options = { hibernate: true };

  // A no-op, but this assigns room to this.room (thanks typescript!)
  constructor(readonly room: Party.Room) {}

  async onConnect(
    conn: Party.Connection<ConnectionState>,
    ctx: Party.ConnectionContext
  ) {
    const id = conn.id;
    const { request } = ctx;
    const { latitude, longitude , city, colo, continent, country: pais, region: zone, regionCode: zoneCode } = request.cf!;
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    
    // const { data } = await geocode({ lat, lng });
    // const { properties } = data.features.pop()
    // const { country, region, district, place } = properties.context
    
    console.log('detected the following region', pais, colo, zone);
    
    //TODO: add error handling for connections missing fingerprint
    const fingerprint = new URL(request.url).searchParams.get(FINGERPRINT_KEY)
    const payload = {
      lat, lng, id, 
      signature: fingerprint, 
      location: [lat, lng], 
      city, colo, continent, zone, zoneCode,
      country: pais,

      // place: { country, region, district, place },
      cf: request.cf
    };
    const connect_event = event<Position>("connection", payload, fingerprint)

    conn.setState(connect_event.data as Position);
    conn.send(json(connect_event));
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

  //HTTP request handler
  async onRequest(request: Party.Request) {
    if (request.method.toUpperCase() !== 'POST') {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload = await request.json<Event<object>>();
    if (!payload.data || !payload.source || !payload.type) {
      return new Response("Bad Request", { status: 400 });
    }
    //validate event
    payload.cf = request.cf;
    emit(payload);
    return new Response("OK");
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
