import "@testing-library/jest-dom";
import { fireEvent } from "@testing-library/react";
import Landing from "../components/Landing";
import SelectRole from "../components/fields/SelectRole";
import MainLayout from "../components/MainLayout";
import { computeCredentials } from "config/Credentials";
import Ledger from "@daml/ledger";
import { createBrowserHistory, createMemoryHistory } from "history";

import { shallow, mount, render, configure } from "enzyme";
import EnzymeAdapter from "enzyme-adapter-react-16";
import DamlLedger from "@daml/react";
import { MemoryRouter, Router, useHistory } from "react-router-dom";
import Referral from "views/referrals/Referral";
import Confirm from "async-prompt";
import { useLedger } from "@daml/react";
import { Main } from "@daml.js/healthcare-claims-processing";
import { useParty, useStreamQueries } from "@daml/react";
import Routes from "routes/Routes";
import Patients from "views/patients/Patients";

import TabularView from "components/TabularScreen";
import { usePatients } from "hooks/patients";

configure({ adapter: new EnzymeAdapter() });

const Test = ({ handleClick }) => {
  const pcpResult = useStreamQueries(Main.Provider.Provider).contracts;
  setTimeout(() => {
    console.log({ pcpResult });
  }, 3000);
  return (
    <button
      onClick={() => {
        handleClick(pcpResult);
      }}
    >
      Click
    </button>
  );
};

describe.skip("Workflow test (NOTE: if continue, the ledger should be empty except for the default populated values)", () => {
  it("Create referral", async () => {
    const credentials = computeCredentials("PrimaryCareProvider");
    new Ledger({ token: credentials.token });
    const history = createBrowserHistory();

    const handleClick = jest.fn();
    render(
      <DamlLedger
        reconnectThreshold={3000}
        token={credentials.token}
        party={credentials.party}
      >
        <Test handleClick={handleClick} />
      </DamlLedger>
    );

    // var wrapper = await render(
    //   <DamlLedger
    //     reconnectThreshold={3000}
    //     token={credentials.token}
    //     party={credentials.party}
    //   >
    //     <Router history={history}>
    //       <TabularView
    //         title="Patients"
    //         useData={() => usePatients({}).overviews}
    //         fields={[
    //           { label: "Name", getter: (o) => o?.policy?.patientName },
    //           { label: "Insurance ID", getter: (o) => o?.policy?.insuranceID },
    //         ]}
    //         tableKey={(o) => o?.policy?.patient}
    //         itemUrl={(o) => o?.policy?.patient}
    //       />
    //     </Router>
    //   </DamlLedger>
    // );
    // console.log({ wrapper });
    // var res = wrapper.find("div").length;
    // console.log({ res });
    // expect(res).toEqual(1);
    /*
    var t = wrapper.simulate;
    wrapper.find(Patients).reduce((pathMap: any, route) => {
      console.log({ pathMap, route });
    }, {});
    //const ledger = useLedger();
    */
  });
});
