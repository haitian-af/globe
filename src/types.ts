import type { Event }  from './events'
// Representing a person's position
export type Position = {
  lat: number;
  lng: number;
  id: string;
  region?: any;
  signature: string | null;
};

// Messages that we'll send to the client
export type OutgoingMessage =
  | {
      type: "add-marker";
      position: Position;
    }
  | {
      type: "remove-marker";
      id: string;
    };

// This is the state that we'll store on each connection
export type ConnectionState = Position // { position: Position; };