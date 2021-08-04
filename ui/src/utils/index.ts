import { useState, useMemo } from "react";
import dateFormat from "dateformat";
import { Event as DEvent, CreateEvent } from "@daml/ledger";

export function intercalate<X>(xs: X[], sep: X) {
  return xs.flatMap((x) => [sep, x]).slice(1);
}

export function* mapIter<A, B>(
  f: (_: A) => B,
  i: IterableIterator<A>
): IterableIterator<B> {
  for (const x of i) {
    yield f(x);
  }
}

export function leftJoin<K, X, Y>(
  xs: Map<K, X>,
  ys: Map<K, Y>
): Map<K, [X, Y | undefined]> {
  return new Map(mapIter(([k, x]) => [k, [x, ys.get(k)]], xs.entries()));
}

export function innerJoin<K, X, Y>(
  xs: Map<K, X>,
  ys: Map<K, Y>
): Map<K, [X, Y]> {
  let ret = new Map();
  for (const [k, x] of xs.entries()) {
    const y = ys.get(k);
    if (y) ret.set(k, [x, y]);
  }
  return ret;
}

export const creations: (_: DEvent<object>[]) => CreateEvent<object>[] = (
  evts
) => evts.flatMap((a) => ("created" in a ? [a.created] : []));

export const formatDate = (d: Date) => dateFormat(d, "ddd, mmm d, yyyy");

// Requirement: do not pass an array as "memoKeys" argument,
//  since it's assumed that "useMemo" doesn't look at the content
//  of arrays.
export function useAsync<T>(f: () => Promise<T>, memoKeys: any): T | null {
  const [[v, lastMemoKeys], setV] = useState<[T | null, any]>([null, null]);
  useMemo(
    // some false positives so we do the extra comparison to avoid extra `setV`
    () => {
      if (JSON.stringify(memoKeys) !== JSON.stringify(lastMemoKeys)) {
        f().then((nv) => setV([nv, memoKeys]));
      }
    },
    [f, memoKeys, lastMemoKeys]
  );
  return v;
}

export const Nothing = Symbol("Nothing");

export const validateNonEmpty = (label: string) => (a: any) => {
  let error;
  if (a === Nothing) {
    error = `${label} is required`;
  }
  return error;
};
