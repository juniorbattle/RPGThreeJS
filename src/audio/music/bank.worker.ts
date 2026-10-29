/// <reference lib="webworker" />
/** Computes the rooms and the sample bank off the main thread: one message per result, transferred without copy. */
import { compute, type PlanItem } from './bank';
import { impulseResponse, type HallId } from './hall';

self.onmessage = (event: MessageEvent<{ contextRate: number; halls: HallId[]; items: PlanItem[] }>) => {
  const { contextRate, halls, items } = event.data;
  const post = (message: unknown, transfer: Transferable[]) => (self as unknown as Worker).postMessage(message, transfer);
  for (const hall of halls) {
    const [left, right] = impulseResponse(contextRate, hall);
    post({ hall, left, right }, [left.buffer, right.buffer]);
  }
  for (const item of items) {
    const data = compute(contextRate, item);
    post({ item, data }, [data.buffer]);
  }
  post({ done: true }, []);
};
