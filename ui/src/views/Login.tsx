// Copyright (c) 2021 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";
import Credentials, { computeCredentials } from "config/Credentials";
import Ledger from "@daml/ledger";
import Landing from "components/Landing/index";
import { useEffect } from "react";
import SelectRole from "components/fields/SelectRole";
import { deploymentMode } from "config/config";
import { useAuth0 } from "@auth0/auth0-react";
import { ledgerId } from "config/config";

type Props = {
  onLogin: (credentials: Credentials) => void;
};

const makeLoginUrl = () => {
  let host = window.location.host.split(".");
  const ledgerId = host[0];
  let loginUrl = host.slice(1);
  loginUrl.unshift("login");

  return (
    loginUrl.join(".") +
    (window.location.port ? ":" + window.location.port : "") +
    "/auth/login?ledgerId=" +
    ledgerId
  );
};

function loginDablUser(): void {
  window.open(`https://${makeLoginUrl()}`, "_self");
}

// React component for the login screen of the `App`.
const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    getAccessTokenSilently,
  } = useAuth0();

  const login = useCallback(
    async (credentials: Credentials) => {
      try {
        console.log("Attempting Login");
        // Initiate new ledger
        const ledger = new Ledger({ token: credentials.token });
        console.log("Got ledger", { ledger });
        console.log(credentials);
        // Set credentials to main index component to initiate routes
        onLogin(credentials);
      } catch (error) {
        alert(`Unknown error:\n${error}`);
      }
    },
    [onLogin]
  );

  const handleLogin = (username: string) => async (event: React.MouseEvent) => {
    event.preventDefault();
    // Compute tokens based on username and call login
    await login(computeCredentials(username));
  };

  const handleLoginAuth0 = () => {
    if (
      !process.env.REACT_APP_AUTH0_DOMAIN ||
      !process.env.REACT_APP_AUTH0_LOGIN_ID
    ) {
      alert("Please make sure to configure the .env file before using Auth0");
      return;
    }
    loginWithRedirect();
  };

  (async function () {
    if (isLoading === false && isAuthenticated === true) {
      if (user !== undefined) {
        const creds: Credentials = {
          party: user["https://daml.com/ledger-api"],
          token: await getAccessTokenSilently({
            audience: "https://daml.com/ledger-api",
          }),
          ledgerId,
        };
        login(creds);
      }
    }
  })();

  useEffect(() => {
    /**
     * Try to signin with url based authentication details
     * Authentication details are passed through query params "token" and "party"
     */
    const url = new URL(window.location.toString());
    const token = url.searchParams.get("token");
    if (token === null) {
      return;
    }
    const party = url.searchParams.get("party");
    if (party === null) {
      throw Error(
        "When 'token' is passed via URL, 'party' must be passed too."
      );
    }
    url.search = "";
    window.history.replaceState(window.history.state, "", url.toString());
    //login({ token, party, ledgerId });
  }, [login]);

  return (
    <div className="main-grid main-grid-wide font-alata">
      <Landing />
      <div className="relative flex flex-col flex-grow justify-center items-center">
        <img
          src="/logo-with-name.svg"
          alt="Daml Health logo"
          className="absolute top-7 left-11"
        />

        {Boolean(deploymentMode) ? (
          <div className="flex flex-col justify-center items-stretch space-y-4 w-80">
            <button className="btn btn-gray" onClick={loginDablUser}>
              Log in with DABL
            </button>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-stretch space-y-4 w-80">
            <SelectRole handleLogin={handleLogin} />
          </div>
        )}
        <p className="flex flex-col justify-center items-stretch font-sans p-4 text-center space-y-4 w-80">
          OR
        </p>

        <button
          className="btn btn-gray"
          disabled={isLoading || isAuthenticated}
          onClick={handleLoginAuth0}
        >
          Log in with Auth0
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
