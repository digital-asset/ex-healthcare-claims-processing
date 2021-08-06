// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { useParty } from "@daml/react";
import { Link, Route } from "react-router-dom";
import "@fontsource/alata";
import { formatDate } from "./Common";

type TabsProps = {
  [index: string]: {
    to: string;
    icon: string;
    exact?: boolean;
    label: string;
  };
};
const tabs: TabsProps = {
  profile: {
    to: "/",
    icon: "user",
    exact: true,
    label: "Profile",
  },
  referrals: {
    to: "/provider/referrals",
    icon: "tray",
    label: "Referrals",
  },
  appointments: {
    to: "/provider/appointments",
    icon: "calendar-blank",
    label: "Appointments",
  },
  treatments: {
    to: "/provider/treatments",
    icon: "first-aid-kit",
    label: "Treatments",
  },
  claims: {
    to: "/provider/claims",
    icon: "currency-circle-dollar",
    label: "Claims",
  },
  patients: {
    to: "/provider/patients",
    icon: "person",
    label: "Patients",
  },
  bills: {
    to: "/patient/bills",
    icon: "currency-circle-dollar",
    label: "Bills",
  },
};

type TabProps = { to: string; exact?: boolean; icon: string; label: string };

const TabLink: React.FC<TabProps> = ({ to, label, icon, exact }) => {
  return (
    <Route
      path={to}
      exact={exact}
      children={({ match }) => (
        <Link
          to={to}
          className={
            "flex flex-grow-0 h-9 items-center text-blue text-sm font-alata mr-3 ml-3 mt-1 mb-1 rounded tab-test" +
            (match ? " tab-active" : " tab-hover")
          }
          id={`tab-link-${label.replace(" ", "-")}`}
        >
          <i
            className={"ph-" + icon + " text-blueGray-400 text-2xl center m-4"}
          />
          {label}
        </Link>
      )}
    />
  );
};

const sidebar: Map<string, Array<TabProps>> = new Map([
  ["Patient1", [tabs.profile, tabs.appointments, tabs.treatments, tabs.bills]],
  ["PrimaryCareProvider", [tabs.profile, tabs.referrals, tabs.patients]],
  [
    "Radiologist",
    [
      tabs.profile,
      tabs.referrals,
      tabs.appointments,
      tabs.treatments,
      tabs.claims,
      tabs.patients,
    ],
  ],
  ["InsuranceCompany", [tabs.claims]],
]);

type MainLayoutProps = {
  onLogout: () => void;
  children: React.ReactChild;
};

/**
 * Wrapper for the main layout of the app
 * Component render tabs to other routes based on the authorized party
 * Accepts one parameter "onLogout" to change the authorized party
 */
const MainLayout: React.FC<MainLayoutProps> = ({ onLogout, children }) => {
  const [date] = React.useState(new Date());
  const role = useParty();

  // get tabs within the authorized scope
  const roleTabs = sidebar.get(role) ?? [];

  return (
    <div className="main-grid main-grid-narrow font-alata">
      <div className="bg-trueGray-50 flex flex-col justify-start text-sm text-trueGray-500">
        <img
          src="/logo-with-name.svg"
          alt="Daml Health logo"
          className="inline-block ml-px30 mt-px25 mb-7 self-start"
        />

        {roleTabs.map(({ to, exact, icon, label }) => (
          <TabLink icon={icon} to={to} exact={exact} label={label} key={to} />
        ))}
        <div className="flex-grow" />
        <hr className="mx-3" />
        <div className="mx-7 py-2">
          <div className="my-2">
            <div>Today's Date:</div>
            <div className="text-sm text-trueGray-400">{formatDate(date)}</div>
          </div>
          <div className="my-2">
            Selected Role:
            <div className="text-sm text-trueGray-400" id="current-role">
              {role}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex flex-grow-0 h-9 items-center text-blue text-sm mr-3 ml-3 mt-1 mb-1 rounded tab-hover logout-button"
        >
          <i className={"ph-users text-blueGray-400 text-2xl center m-4"} />
          Change Roles
        </button>
      </div>
      <div className="relative bg-trueGray-100">{children}</div>
    </div>
  );
};

export default React.memo(MainLayout);
