import React, { useState, PropsWithChildren } from "react";
import { Link, useRouteMatch } from "react-router-dom";
import { CaretRight } from "phosphor-react";
import { PageTitleDiv, PageTitleSpan } from "./Common";

type TabularViewFields<T> = {
  label: string;
  getter: (a: T) => string;
  value?: any;
};

type TabularViewConfig<T, F> = {
  title: string;
  fields: F;
  tableKey: (a: T) => string;
  itemUrl: (a: T) => string;
  useData: () => readonly T[];
  searchFunc?: (a: string) => (b: T) => boolean;
};

/**
 * High adaptable component to display a tables
 * Main params explained:
 *  useData: contains a function to stream data
 *  itemUrl: Function that returns the redirect url base
 *  tableKey: Function that returns the the unique table key
 */
function TabularView<T>({
  title,
  fields,
  tableKey,
  itemUrl,
  useData,
  searchFunc,
}: PropsWithChildren<TabularViewConfig<T, TabularViewFields<T>[]>>) {
  const match = useRouteMatch();
  const [search, setSearch] = useState<string | null>(null);

  const data = useData().filter(
    (searchFunc || ((a) => (b) => true))(search || "")
  );

  return (
    <>
      <PageTitleDiv>
        <PageTitleSpan title={title} />
      </PageTitleDiv>
      <div className="flex p-3 bg-white m-6">
        <input
          type="text"
          value={search || ""}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or insurance ID..."
          className="w-full px-3 py-2 h-10 bg-trueGray-100"
        />
      </div>
      <table className="table-fixed m-6 table-widths-eq">
        <thead>
          <tr className="text-left text-trueGray-500 text-sm">
            {fields.map((a) => (
              <th className="" key={a.label}>
                {" "}
                {a.label}{" "}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {data.map((po) => {
            let url = match?.url + "/" + itemUrl(po);
            return (
              <tr
                key={tableKey(po)}
                className="bg-white text-trueGray-500 hover:bg-trueGray-100 "
              >
                {fields.map((g, idx) => (
                  // NOTE 1: We enable tabbing only to the first cell since
                  //  all table cells for each row link to the same URL.
                  // Thus, pressing the Tab key will move down one row per press.
                  //
                  // NOTE 2: Adding the "flex" className makes the entire table cell
                  //  become a link, instead of just the text inside the table cell.
                  <td key={idx}>
                    <Link
                      to={url}
                      id={`table-link-test-${idx}`}
                      className="flex"
                      {...(idx === 0 ? {} : { tabIndex: -1 })}
                    >
                      {g.getter(po)}
                    </Link>
                  </td>
                ))}
                <td>
                  <Link
                    to={url}
                    className="flex justify-end"
                    {...{ tabIndex: -1 }}
                  >
                    <CaretRight />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default TabularView;
