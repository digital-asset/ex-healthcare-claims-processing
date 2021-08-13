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

  //example callback: https://lmw46c77h4kaxptl.projectdabl.com/?party=ledger-party-bae5d613-2f3f-46f0-9f8d-558239dbc9d1&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImRhYmwtODA1NGRjYjEtMzQ0Mi00MmJjLThkODktZmFjZGQyZDIwZTllIn0.eyJpc3MiOiJodWIuZGFtbC5jb20vbG9naW4iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDEwMDE5NDE1Nzg1NDg2NTgwOTkxNCIsImV4cCI6MTYyODkzMjM4NiwiaHR0cHM6Ly9kYW1sLmNvbS9sZWRnZXItYXBpIjp7ImFjdEFzIjpbImxlZGdlci1wYXJ0eS1iYWU1ZDYxMy0yZjNmLTQ2ZjAtOWY4ZC01NTgyMzlkYmM5ZDEiXSwiYXBwbGljYXRpb25JZCI6ImRhbWxodWIiLCJsZWRnZXJJZCI6ImxtdzQ2Yzc3aDRrYXhwdGwiLCJyZWFkQXMiOlsibGVkZ2VyLXBhcnR5LWJhZTVkNjEzLTJmM2YtNDZmMC05ZjhkLTU1ODIzOWRiYzlkMSJdfSwibGVkZ2VySWQiOiJsbXc0NmM3N2g0a2F4cHRsIiwib3duZXIiOiJ1c2VyLWdyYW50LWRiYWMwMmJiLWNhZDgtNDAwNy04YzdhLTg3M2ExNTNiOTE4MiIsInBhcnR5IjoibGVkZ2VyLXBhcnR5LWJhZTVkNjEzLTJmM2YtNDZmMC05ZjhkLTU1ODIzOWRiYzlkMSIsInBhcnR5TmFtZSI6IlNlcHBlIHZhbiBEYWxlbiJ9.l10jS18LZeQRscdXcwxtLaOplT3nu6D3TCSvbM84w0OjvS0gjodzFnNyuTP1bEjaVKrOc_MNKbXrh7eyotxS9rQjWQkkv0wueWY3vSGB-NDTW70ye_tEMsOH43G9aVHOpTFzFazW7owbLC_xdT11kYF0TdMK9NDVBkyCua9um9M

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
