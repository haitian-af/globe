import { createId as cuid } from '@paralleldrive/cuid2'

export type Event<T> = {
  id: string;
  specversion: string;
  source: string;
  type: string;
  time?: string;
  datacontenttype: string;
  data?: T;
  data_base64?: string;
  [key: string]: unknown;
};

const INGEST_ENDPOINT = 'https://api.haitian.community/v1/ingest'; //'http://localhost:8080/v1/ingest';// 
export const emit = async (e: Event<unknown>): Promise<void> => {
  try {
    await fetch(INGEST_ENDPOINT, {
      method: "post",
      body: JSON.stringify(e),
    });
  } catch (e) { 
    console.error(e)
  }
};

export const json = JSON.stringify

export const event = <T,>(type: string, data: T, attrs: any = {}): Event<T> => ({
  id: cuid(),
  specversion: "1.0",
  source: "party",
  type,
  time: new Date().toISOString(),
  datacontenttype: 'application/json',
  data,
  ...attrs,
});
