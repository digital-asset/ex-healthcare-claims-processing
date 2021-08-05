import "@testing-library/jest-dom";
import React from "react";
//import userEvent from "@testing-library/user-event";
import Routes from "../routes/Routes";
import { computeCredentials } from "config/Credentials";
import Ledger from "@daml/ledger";
import { createMemoryHistory } from "history";

import { shallow, configure } from "enzyme";
import EnzymeAdapter from "enzyme-adapter-react-16";
import { Route } from "react-router";

//import all views
import Profile from "views/Profile";
import Treatment from "views/treatments/Treatment";
import Treatments from "views/treatments/Treatments";
import Appointment from "views/appointments/Appointment";
import Appointments from "views/appointments/Appointments";
import Claim from "views/claims/Claim";
import Claims from "views/claims/Claims";
import Referral from "views/referrals/Referral";
import Referrals from "views/referrals/Referrals";
import Patient from "views/patients/Patient";
import Patients from "views/patients/Patients";
import Bill from "views/bills/Bill";
import Bills from "views/bills/Bills";

configure({ adapter: new EnzymeAdapter() });

describe("Test all Patient1 routes and views", () => {
  const credentials = computeCredentials("Patient1");
  new Ledger({ token: credentials.token });
  const history = createMemoryHistory();
  const wrapper = shallow(
    <Routes
      useParty={() => "Patient1"}
      history={history}
      setCredentials={() => {}}
    />
  );

  const pathMap = wrapper.find(Route).reduce((pathMap: any, route) => {
    const routeProps = route.props();
    pathMap[routeProps.path] = routeProps.component;
    return pathMap;
  }, {});

  it("Render all patient views", () => {
    expect(pathMap["/"]).toBe(Profile);
    expect(pathMap["/provider/treatments/"]).toBe(Treatments);
    expect(pathMap["/provider/treatments/:treatmentId"]).toBe(Treatment);
    expect(pathMap["/provider/appointments/"]).toBe(Appointments);
    expect(pathMap["/provider/appointments/:appointmentId"]).toBe(Appointment);
    expect(pathMap["/patient/bills/"]).toBe(Bills);
    expect(pathMap["/patient/bills/:billId"]).toBe(Bill);
  });
});

describe("Test all Radiologist routes and views", () => {
  const credentials = computeCredentials("Radiologist");
  new Ledger({ token: credentials.token });
  const history = createMemoryHistory();
  const wrapper = shallow(
    <Routes
      useParty={() => "Radiologist"}
      history={history}
      setCredentials={() => {}}
    />
  );

  const pathMap = wrapper.find(Route).reduce((pathMap: any, route) => {
    const routeProps = route.props();
    pathMap[routeProps.path] = routeProps.component;
    return pathMap;
  }, {});

  it("Render all radiologist views", () => {
    expect(pathMap["/"]).toBe(Profile);
    expect(pathMap["/provider/treatments/"]).toBe(Treatments);
    expect(pathMap["/provider/treatments/:treatmentId"]).toBe(Treatment);
    expect(pathMap["/provider/appointments/"]).toBe(Appointments);
    expect(pathMap["/provider/appointments/:appointmentId"]).toBe(Appointment);
    expect(pathMap["/provider/claims/"]).toBe(Claims);
    expect(pathMap["/provider/claims/:claimId"]).toBe(Claim);
    expect(pathMap["/provider/referrals/"]).toBe(Referrals);
    expect(pathMap["/provider/referrals/:referralId"]).toBe(Referral);
    expect(pathMap["/provider/patients/"]).toBe(Patients);
    expect(pathMap["/provider/patients/:patientId"]).toBe(Patient);
  });
});

describe("Test all PrimaryCareProvider routes and views", () => {
  const credentials = computeCredentials("PrimaryCareProvider");
  new Ledger({ token: credentials.token });
  const history = createMemoryHistory();
  const wrapper = shallow(
    <Routes
      useParty={() => "PrimaryCareProvider"}
      history={history}
      setCredentials={() => {}}
    />
  );

  const pathMap = wrapper.find(Route).reduce((pathMap: any, route) => {
    const routeProps = route.props();
    pathMap[routeProps.path] = routeProps.component;
    return pathMap;
  }, {});

  it("Render all primary care provider views", () => {
    expect(pathMap["/"]).toBe(Profile);
    expect(pathMap["/provider/referrals/"]).toBe(Referrals);
    expect(pathMap["/provider/referrals/:referralId"]).toBe(Referral);
    expect(pathMap["/provider/patients/"]).toBe(Patients);
    expect(pathMap["/provider/patients/:patientId"]).toBe(Patient);
  });
});

describe("Test all InsuranceCompany routes and views", () => {
  const credentials = computeCredentials("InsuranceCompany");
  new Ledger({ token: credentials.token });
  const history = createMemoryHistory();
  const wrapper = shallow(
    <Routes
      useParty={() => "InsuranceCompany"}
      history={history}
      setCredentials={() => {}}
    />
  );

  const pathMap = wrapper.find(Route).reduce((pathMap: any, route) => {
    const routeProps = route.props();
    pathMap[routeProps.path] = routeProps.component;
    return pathMap;
  }, {});

  it("Render all primary care provider views", () => {
    expect(pathMap["/provider/claims/"]).toBe(Claims);
    expect(pathMap["/provider/claims/:claimId"]).toBe(Claim);
  });
});
