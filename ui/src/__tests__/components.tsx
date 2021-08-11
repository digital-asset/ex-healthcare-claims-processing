import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
//import userEvent from "@testing-library/user-event";
import TabularView from "../components/TabularScreen";
import SingleItemView from "../components/SingleItemView";

import { ProviderProfile, PatientProfile } from "../components/ProfileCards";
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

describe("Test rendering main components", () => {
  it("Table component", async () => {
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

    // Table has one empty <th /> so +1 on length
    var countRows = container.container.querySelectorAll("th").length;
    expect(countRows).toEqual(dataMockup().length + 1);
  });

  it("Single item component", async () => {
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

  it("Provider profile card", async () => {
    var container = render(
      <ProviderProfile
        provider={{
          providerName: "Daml Healthcare",
          operator: "Daml",
          provider: "Daml Health",
          demographics: {
            providerHIN: "",
            providerTaxID: "",
            providerBankDFINumber: "",
            providerBankAccountNumber: "",
            providerType: "Primary",
            providerAddressFirstLine: "",
            providerAddressSecondLine: "",
            providerCity: "",
            providerState: "",
            providerZipCode: "",
          },
        }}
      />
    );
    expect(container.container).toHaveTextContent("Daml Healthcare");
  });

  it("Patient profile card", () => {
    var container = render(
      <PatientProfile
        patient={{
          operator: "Patient1",
          patient: "Patient1",
          patientName: "Joe doe",
          insuranceID: "",
          primaryCareProviderID: "",
          demographics: {
            patientGender: "",
            patientSocialSecurityNumber: "",
            patientDateOfBirth: "",
            patientAddressLine1: "",
            patientAddressLine2: "",
            patientCity: "",
            patientState: "",
            patientZipCode: "",
          },
        }}
      />
    );
    expect(container.container).toHaveTextContent("Joe doe");
  });
});
