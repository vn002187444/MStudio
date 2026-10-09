import {
  isMeaningfulReaderEventType,
  type ReaderEventInput,
} from "@mstudio/contracts";

export const DEFAULT_READER_EVENT_SAMPLING_RATE = 0.05;

export function readerEventSamplingRate(
  env: { READER_EVENT_SAMPLING_RATE?: string },
): number {
  const raw = env.READER_EVENT_SAMPLING_RATE;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_READER_EVENT_SAMPLING_RATE;
  }
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_READER_EVENT_SAMPLING_RATE;
  }
  return Math.min(1, Math.max(0, parsed));
}

export function partitionReaderEvents(
  events: ReaderEventInput[],
  samplingRate: number,
  random: () => number = Math.random,
): { accepted: ReaderEventInput[]; sampledOut: number } {
  const accepted: ReaderEventInput[] = [];
  let sampledOut = 0;
  for (const event of events) {
    if (
      isMeaningfulReaderEventType(event.eventType) ||
      random() < samplingRate
    ) {
      accepted.push(event);
    } else {
      sampledOut += 1;
    }
  }
  return { accepted, sampledOut };
}
