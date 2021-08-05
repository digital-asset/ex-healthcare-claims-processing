// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import LoginScreen from "views/Login";
import Routes from "routes/Routes";
import DamlLedger from "@daml/react";
import Credentials from "config/Credentials";
import { createBrowserHistory as createHistory } from "history";
import { useParty } from "@daml/react";

/**
 * React component for the entry point into the application.
 */
// APP_BEGIN
const App: React.FC = () => {
  const [credentials, setCredentials] = React.useState<
    Credentials | undefined
  >();

  const history = createHistory();

  return credentials ? (
    <DamlLedger
      reconnectThreshold={3000}
      token={credentials.token}
      party={credentials.party}
    >
      <Routes
        useParty={useParty}
        history={history}
        setCredentials={setCredentials}
      />
    </DamlLedger>
  ) : (
    <LoginScreen onLogin={setCredentials} />
  );
};
// APP_END

export default App;
