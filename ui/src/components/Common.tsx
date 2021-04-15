import React, { useState, useMemo } from 'react'
import { NavLink, Route, Switch, useRouteMatch, useParams } from 'react-router-dom';

type FieldProps = {label: string, value: string};

function intercalate<X>(xs: X[], sep: X) {
  return xs.flatMap(x => [sep,x]).slice(1);
}

export function* mapIter<A,B>(
  f: (_: A) => B,
  i: IterableIterator<A>
): IterableIterator<B>
{
  for (const x of i) {
    yield f(x);
  }
}

function leftJoin<K, X, Y>(xs: Map<K, X>, ys: Map<K, Y>): Map<K, [X, Y | undefined]> {
  return new Map(mapIter(
    (([k, x]) => [k, [x, ys.get(k)]]),
    xs.entries(),
  ));
}

function innerJoin<K, X, Y>(xs: Map<K, X>, ys: Map<K, Y>): Map<K, [X, Y]> {
  let ret = new Map();
  for (const [k, x] of xs.entries()) {
    const y = ys.get(k);
    if (y)
      ret.set(k, [x, y]);
  }
  return ret;
}

const TabLink: React.FC<{to:string}> = ({children,to}) => {
  const match = useRouteMatch();
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
  )
}

const PageTitle: React.FC<{title:string}> = ({title}) => {
  return (
    <div className="text-3xl text-trueGray-700 m-6"> {title} </div>
  )
}

const FieldsRow: React.FC<{fields: FieldProps[]}> = ({fields}) => {
  return (
    <div className="flex space-x-12">
      { fields.map(f =>
        <Field label={f.label} value={f.value} />
        )}
    </div>
  )
}

const Field: React.FC<FieldProps> = ({label, value}) => {
  return (
    <div className="flex flex-col">
      <div className="text-sm text-trueGray-500">
        {label}
      </div>
      <div className="text-base">
        {value}
      </div>
    </div>
  )
}

function useAsync<T>(f: () => Promise<T>, memoKeys: [any]) : T | null {
  const [[v, lastMemoKeys], setV] = useState<[T | null, any]>([null, null]);
  useMemo(
    // some false positives so we do the extra comparison to avoid extra `setV`
    () => { if(JSON.stringify(memoKeys) != JSON.stringify(lastMemoKeys)) { f().then(nv => setV([nv, memoKeys])) } },
    memoKeys);
  return v;
}

export { Field, FieldsRow, PageTitle, TabLink, innerJoin, leftJoin, intercalate, useAsync };