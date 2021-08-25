// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect } from "react";
import LoginScreen from "views/Login";
import Routes from "routes/Routes";
import DamlLedger from "@daml/react";
import Credentials from "config/Credentials";
import { createBrowserHistory as createHistory } from "history";
import { useParty } from "@daml/react";
import { partyFromToken, ledgerIdFromToken, setCookie } from "utils";
import { cookieName } from "config/config";

/**
 * React component for the entry point into the application.
 */

// APP_BEGIN
const App: React.FC = () => {
  const [credentials, setCredentials] = React.useState<
    Credentials | undefined
  >();

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const hasCallback = params.party && params.token;
    if (hasCallback) {
      setCookie({
        name: cookieName,
        value: params.token,
        days: 1,
      });
    }

    const tokenCookiePair =
      document.cookie.split("; ").find((row) => row.startsWith(cookieName)) ||
      "";

    const tokenCookieSecret = tokenCookiePair.slice(
      tokenCookiePair.indexOf("=") + 1
    );

    const token = tokenCookieSecret || localStorage.getItem("daml.token");
    if (!token) {
      return undefined;
    }

    const party =
      partyFromToken({ token }) || localStorage.getItem("daml.party");
    if (!party) {
      return undefined;
    }

    const ledgerId = ledgerIdFromToken({ token });

    localStorage.setItem("daml.token", token);
    localStorage.setItem("daml.party", party);
    if (!ledgerId) return undefined;
    setCredentials({
      token,
      party,
      ledgerId,
    });
  }, []);

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
