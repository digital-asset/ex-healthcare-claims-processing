import { useState, useMemo } from "react";
import dateFormat from "dateformat";
import { Event as DEvent, CreateEvent } from "@daml/ledger";
import jwt_decode from "jwt-decode";

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

export const partyFromToken = ({
  token,
}: {
  token: string;
}): string | undefined => {
  try {
    const decoded: any = jwt_decode(token);
    return decoded["https://daml.com/ledger-api"].actAs.shift();
  } catch (e) {
    console.log(e.message || "failed to extract party from jwt token");
    return undefined;
  }
};

export const ledgerIdFromToken = ({
  token,
}: {
  token: string;
}): string | undefined => {
  try {
    const decoded: any = jwt_decode(token);
    return decoded["https://daml.com/ledger-api"].ledgerId;
  } catch (e) {
    console.log(e.message || "failed to extract ledger id from jwt token");
    return undefined;
  }
};

export const setCookie = ({
  name,
  value,
  days,
}: {
  name: string;
  value: string;
  days: number;
}) => {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + `;`;
};

export const getCookie = ({ name }: { name: string }) => {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    // eslint-disable-next-line eqeqeq
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    // eslint-disable-next-line eqeqeq
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = ({ name }: { name: string }): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.projectdabl.com;`;
};
