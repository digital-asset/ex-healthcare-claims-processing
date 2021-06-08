import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import dateFormat from "dateformat";

type FieldProps = { label: string; value: string };

function intercalate<X>(xs: X[], sep: X) {
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

function leftJoin<K, X, Y>(
  xs: Map<K, X>,
  ys: Map<K, Y>
): Map<K, [X, Y | undefined]> {
  return new Map(mapIter(([k, x]) => [k, [x, ys.get(k)]], xs.entries()));
}

function innerJoin<K, X, Y>(xs: Map<K, X>, ys: Map<K, Y>): Map<K, [X, Y]> {
  let ret = new Map();
  for (const [k, x] of xs.entries()) {
    const y = ys.get(k);
    if (y) ret.set(k, [x, y]);
  }
  return ret;
}

export const formatDate = (d: Date) => dateFormat(d, "ddd, mmm d, yyyy");

const TabLink: React.FC<{ to: string }> = ({ children, to }) => {
  return (
    <NavLink
      exact
      to={to}
      className="text-sm px-2 py-1 text-blue"
      activeStyle={{
        background: "white",
        color: "black",
      }}
    >
      {children}
    </NavLink>
  );
};

const PageTitleDiv: React.FC<{}> = ({ children }) => {
  return <div className="flex items-baseline space-x-4 p-6"> {children} </div>;
};

const PageTitleSpan: React.FC<{ title: string }> = ({ title }) => {
  return <span className="text-3xl text-trueGray-700"> {title} </span>;
};

const PageSubTitleSpan: React.FC<{ title: string }> = ({ title }) => {
  return <span className="text-trueGray-500 text-sm"> {title} </span>;
};

const FieldsRow: React.FC<{ fields: FieldProps[] }> = ({ fields }) => {
  return (
    <div className="flex space-x-12">
      {fields.map((f) => (
        <Field label={f.label} value={f.value} key={f.label} />
      ))}
    </div>
  );
};

const Field: React.FC<FieldProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col">
      <div className="text-sm text-trueGray-500">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
};

const Label: React.FC<{ content: string }> = ({ content }) => {
  return <div className="text-sm text-center text-trueGray-500">{content}</div>;
};

const Message: React.FC<{ title: string; content: string }> = ({
  title,
  content,
}) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="text-2xl text-center">{title}</div>
      <Label content={content} />
    </div>
  );
};

// Requirement: do not pass an array as "memoKeys" argument,
//  since it's assumed that "useMemo" doesn't look at the content
//  of arrays.
function useAsync<T>(f: () => Promise<T>, memoKeys: any): T | null {
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

export {
  Field,
  FieldsRow,
  Label,
  Message,
  PageTitleDiv,
  PageTitleSpan,
  PageSubTitleSpan,
  TabLink,
  innerJoin,
  leftJoin,
  intercalate,
  useAsync,
};
