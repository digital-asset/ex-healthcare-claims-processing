///
/// Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
/// SPDX-License-Identifier: Apache-2.0
///

export enum DeploymentMode {
  DEV,
  PROD_OTHER,
}

export const deploymentMode: DeploymentMode =
  process.env.NODE_ENV === "development"
    ? DeploymentMode.DEV
    : DeploymentMode.PROD_OTHER;

// Decide the ledger ID based on
// an environment variable, falling back on the sandbox ledger ID.
export const ledgerId: string =
  process.env.REACT_APP_LEDGER_ID ?? "example-create-daml-app-sandbox";

export const cookieName = "DAMLHUB_LEDGER_ACCESS_TOKEN";
