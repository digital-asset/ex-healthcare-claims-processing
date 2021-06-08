// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import MainView from "./MainView";
import { useParty } from "@daml/react";
import { Link, Route, useHistory } from "react-router-dom";
import "@fontsource/alata";
import { formatDate } from "./Common";

type Props = {
  onLogout: () => void;
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
            "flex flex-grow-0 h-9 items-center text-blue text-sm font-alata mr-3 ml-3 mt-1 mb-1 rounded" +
            (match ? " tab-active" : " tab-hover")
          }
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

const tabs = {
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
    icon: "pedestrian",
    label: "Patients",
  },
  bills: {
    to: "/patient/bills",
    icon: "currency-circle-dollar",
    label: "Bills",
  },
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

// Defines the page that is shown after logging in for a certain role.
// If a role doesn't have a route here it defaults to '/' (the Profile page).
const roleRoutes: Map<string, string> = new Map([
  ["InsuranceCompany", "/provider/claims"],
]);

const MainScreen: React.FC<Props> = ({ onLogout }) => {
  const [date] = React.useState(new Date());
  const role = useParty();

  // Navigate to the role's start page
  useHistory().push(roleRoutes.get(role) || "/");

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
            <div className="text-sm text-trueGray-400">{role}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex flex-grow-0 h-9 items-center text-blue text-sm mr-3 ml-3 mt-1 mb-1 rounded tab-hover"
        >
          <i className={"ph-users text-blueGray-400 text-2xl center m-4"} />
          Change Roles
        </button>
      </div>
      <div className="relative bg-trueGray-100">
        <MainView />
      </div>
    </div>
  );
};

export default MainScreen;
