// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { Header } from "semantic-ui-react";
import { User } from "phosphor-react";
import { Main } from "@daml.js/healthcare-claims-processing";

// Component to renders the icon of the profile card
const UserIcon: React.FC<{ className: string }> = ({ className }) => {
  return (
    <svg className={className} width="89" height="85" viewBox="0 0 89 85">
      <defs>
        <linearGradient id="userIconGradient" gradientTransform="rotate(90)">
          <stop offset="0%" stopColor="#83a8f6" />
          <stop offset="100%" stopColor="#4c6fea" />
        </linearGradient>
      </defs>
      <mask id="userMask">
        <User size={89} viewBox="22 22 212 212" color="white" />
      </mask>
      <rect
        width="89"
        height="89"
        fill="url(#userIconGradient)"
        mask="url(#userMask)"
      />
    </svg>
  );
};

const ProfileTop: React.FC<{ name: string; role: string }> = ({
  name,
  role,
}) => (
  <>
    <div id="welcome_tag" className="label-sm">
      Welcome!
    </div>
    <UserIcon className="mx-auto mt-16 mb-4" />
    <Header className="text-2xl" as="h2">
      {name}
    </Header>
    <div className="label-sm mt-2 mb-8">{role}</div>
    <hr />
  </>
);

const ProfileKV: React.FC<{ keyS: string; value?: string | null }> = ({
  keyS,
  value,
  children,
}) => (
  <div>
    <div className="sm-trueGray-400">{keyS}</div>
    {value}
    {children}
  </div>
);

const ProfileKVCenter: React.FC<{ keyS: string; value?: string | null }> = ({
  keyS,
  value,
  children,
}) => (
  <div className="mx-auto">
    <div className="sm-trueGray-400">{keyS}</div>
    {value || children || "has none"}
  </div>
);

/**
 * Profile card to render information about the authorized party
 * Note: This profile will only be used for providers (Radiologist and PrimaryCareProvider)
 */
export const ProviderProfile: React.FC<{ provider: Main.Provider.Provider }> =
  ({ provider }) => {
    return (
      <>
        <ProfileTop name={provider?.providerName} role="Provider" />
        <div className="flex text-left sm-trueGray-500 mt-8">
          <ProfileKV keyS="HIN" value={provider?.demographics?.providerHIN} />
          <ProfileKVCenter
            keyS="Tax ID"
            value={provider?.demographics?.providerTaxID}
          />
          <ProfileKV keyS="Address">
            {provider?.demographics?.providerAddressFirstLine}
            <br />
            {provider?.demographics?.providerAddressSecondLine}
            <br />
            {provider?.demographics?.providerCity},{" "}
            {provider?.demographics?.providerState}{" "}
            {provider?.demographics?.providerZipCode}
          </ProfileKV>
        </div>
      </>
    );
  };

/**
 * Profile card to render information about the authorized party
 * Note: This profile will only be used for patients (Patient1)
 */
export const PatientProfile: React.FC<{
  patient: Main.Patient.Patient;
  policy?: Main.Policy.InsurancePolicy;
}> = ({ patient, policy }) => (
  <>
    <ProfileTop name={patient?.patientName} role="Patient" />
    <div className="flex text-left sm-trueGray-500 mt-8">
      <ProfileKV keyS="PCP" value={patient?.primaryCareProviderID} />
      <ProfileKVCenter keyS="Insurance ID" value={patient?.insuranceID} />
      <ProfileKV keyS="Plan" value={policy?.policyType} />
    </div>
  </>
);
