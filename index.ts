import dayjs from "dayjs";
import { FlushableQueue } from "flushable-queue";
import pLimit from "p-limit";

export async function TimedPromise(
  promisesArr: Promise<any>[],
  concurrency: number,
  timeoutOptions?: {
    forMinutes?: number;
    forSeconds?: number;
    untilDate?: Date;
  },
  flushOptions?: {
    flushTimeout?: number;
    flushSize?: number;
    flushCallback: Function;
  }
) {
  const startTime = dayjs();
  const limit = pLimit(concurrency);

  const emptyCallback = () => {};
  const objectQueue = new FlushableQueue(
    flushOptions?.flushCallback || emptyCallback,
    {
      flushSize: flushOptions?.flushSize,
      flushTimeout: flushOptions?.flushTimeout,
    }
  );

  const promises = promisesArr.map((s: any) =>
    limit(async () => {
      if (timeoutOptions?.forMinutes) {
        if (dayjs().diff(startTime, "minutes") > timeoutOptions?.forMinutes) {
          return;
        }
      } else if (timeoutOptions?.forSeconds) {
        if (dayjs().diff(startTime, "seconds") > timeoutOptions?.forSeconds) {
          return;
        }
      } else if (timeoutOptions?.untilDate) {
        if (dayjs(timeoutOptions?.untilDate) > startTime) {
          return;
        }
      }

      const res = await s;
      if (flushOptions?.flushCallback) {
        objectQueue.enqueue(res);
      }

      return res;
    })
  );

  const res = await Promise.all(promises);
  await objectQueue.stop();

  return res;
}
