import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import Landing from "../components/Landing";
import SelectRole from "../components/fields/SelectRole";
import MainLayout from "../components/MainLayout";
import { computeCredentials } from "config/Credentials";
import Ledger from "@daml/ledger";
import { createBrowserHistory } from "history";
import { configure } from "enzyme";
import EnzymeAdapter from "enzyme-adapter-react-16";
import DamlLedger from "@daml/react";
import { Router } from "react-router-dom";

configure({ adapter: new EnzymeAdapter() });

// Test cases to check if all layout components render as expected with the right input
describe("Test rendering layout components", () => {
  it("Landing page layout", () => {
    var container = render(<Landing />);
    expect(container.container).toHaveTextContent("Daml driven healthcare");
  });

  var parties = [
    "Patient1",
    "InsuranceCompany",
    "Radiologist",
    "PrimaryCareProvider",
  ];
  it("Display all roll login buttons", () => {
    var container = render(<SelectRole handleLogin={() => {}} />);
    parties.forEach((party) => {
      var button: HTMLElement | null = container.container.querySelector(
        `#${party}`
      );

      expect(button).toBeInTheDocument();
    });
  });

  it("Display left menue and check if user can change roles", () => {
    const credentials = computeCredentials("Radiologist");
    new Ledger({ token: credentials.token });
    const history = createBrowserHistory();
    const handleClick = jest.fn();

    const container = render(
      <DamlLedger
        reconnectThreshold={3000}
        token={credentials.token}
        party={credentials.party}
      >
        <Router history={history}>
          <MainLayout onLogout={handleClick} children={<></>} />
        </Router>
      </DamlLedger>
    );

    var tabs = container.container.getElementsByClassName("tab-test");
    expect(tabs.length).toEqual(6);
    fireEvent(
      container.getByText(/Change Roles/i),
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
    );

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
