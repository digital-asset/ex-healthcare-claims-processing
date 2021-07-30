import React, { ReactNode, PropsWithChildren } from "react";
import {
  FieldsRow,
  PageTitleDiv,
  PageTitleSpan,
  PageSubTitleSpan,
} from "./Common";

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
 * High adaptable component to display a single itemm view
 * Main params explained:
 *  useData: contains a function to data query
 *  choices: React component that contains a button to render a modal (optional)
 */
function SingleItemView<T>({
  title,
  fields,
  useData,
  choices,
}: PropsWithChildren<
  TabularViewConfig<T, TabularViewFields<T>[][]> & {
    //set "data" type declaration back to T
    choices: (data: any) => ReactNode;
  }
>) {
  const data = useData();

  const content = (po: T) => (
    <div className="flex flex-col p-5 space-y-4 bg-white rounded shadow-lg">
      <div>{choices(po)}</div>
      <hr />
      {fields.map((row, i) => (
        <div key={row.map((r) => r.label).join()}>
          <FieldsRow
            fields={row.map((f) => ({
              label: f.label,
              value: f.getter(po),
            }))}
          />
          {i === fields.length - 1 ? <> </> : <hr />}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <PageTitleDiv>
        <PageTitleSpan title={title} />
        <PageSubTitleSpan title={""} />
      </PageTitleDiv>
      <div className="flex flex-col space-y-2">
        {data.length > 0 && content(data[0])}
      </div>
    </>
  );
}

export default SingleItemView;
