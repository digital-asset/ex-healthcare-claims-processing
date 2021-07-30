// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { useProfile } from "hooks/profile";
import { PatientProfile, ProviderProfile } from "components/ProfileCards";

/**
 * Component to render the profile of the authorized party
 * Two types of profile can be displayed; patient profile and provider profile
 */
const Profile: React.FC = () => {
  const { pcpResult, patientResult, policyResult } = useProfile();

  // return no profile if no provider or patient profile is loaded
  if (pcpResult.length === 0 && patientResult.length === 0) {
    return <></>;
  }

  return (
    <>
      <div className="shadow-2xl size-card rounded-xl content-center flex flex-col text-center m-auto justify-self-center self-center p-12 z-20 bg-white relative">
        {pcpResult.length === 1 ? (
          <ProviderProfile provider={pcpResult[0]?.payload} />
        ) : (
          <PatientProfile
            patient={patientResult[0]?.payload}
            policy={policyResult[0]?.payload}
          />
        )}
      </div>
      <div className="card-GraphicalDots card-gdots-pos1 z-10" />
      <div className="card-GraphicalDots card-gdots-pos2 z-10" />
    </>
  );
};

export default Profile;
