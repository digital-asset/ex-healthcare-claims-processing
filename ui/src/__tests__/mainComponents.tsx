import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
//import userEvent from "@testing-library/user-event";
import TabularView from "../components/TabularScreen";
import SingleItemView from "../components/SingleItemView";

import { Router } from "react-router";
import { createBrowserHistory } from "history";

const dataMockup = () => [{ user: "Joe" }];
const tableFields = [
  {
    getter: (a: any) => a?.user,
    label: "User name",
  },
];
const tableFieldsSingleItem = [
  [
    {
      getter: (a: any) => a?.user,
      label: "User name",
      value: "Joe",
    },
  ],
];

const itemUrl = (a: any) => a.user;
const tableKey = (a: any) => a.user;

test("TabularView component", async () => {
  const history = createBrowserHistory();

  var container = render(
    <Router history={history}>
      <TabularView
        useData={dataMockup}
        fields={tableFields}
        title={"Test table"}
        itemUrl={itemUrl}
        tableKey={tableKey}
      />
    </Router>
  );

  // Table has one empty <th />
  var countRows = container.container.querySelectorAll("th").length;
  expect(countRows).toEqual(dataMockup().length + 1);
});

test("Single item component", async () => {
  const history = createBrowserHistory();

  var container = render(
    <Router history={history}>
      <SingleItemView
        useData={dataMockup}
        fields={tableFieldsSingleItem}
        title={"Test table"}
        itemUrl={itemUrl}
        tableKey={tableKey}
        choices={() => <></>}
      />
    </Router>
  );

  var joeText = container.container.getElementsByClassName("text-base")[0];
  expect(joeText).toHaveTextContent("Joe");
});
