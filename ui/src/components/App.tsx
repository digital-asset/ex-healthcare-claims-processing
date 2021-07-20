// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import LoginScreen from "./LoginScreen";
import MainScreen from "./MainScreen";
import DamlLedger from "@daml/react";
import Credentials from "../Credentials";
import { Router } from "react-router";
import { createBrowserHistory as createHistory } from "history";

/**
 * React component for the entry point into the application.
 */
// APP_BEGIN
const App: React.FC = () => {
  const [credentials, setCredentials] = React.useState<
    Credentials | undefined
  >();

  const history = createHistory();

  const onLogout = () => {
    setCredentials(undefined);
    // Go back to main profile page; others might not be visible.
    history.replace("");
  };

  return credentials ? (
    <DamlLedger token={credentials.token} party={credentials.party}>
      <Router history={history}>
        <MainScreen onLogout={onLogout} />
      </Router>
    </DamlLedger>
  ) : (
    <LoginScreen onLogin={setCredentials} />
  );
};
// APP_END

export default App;
