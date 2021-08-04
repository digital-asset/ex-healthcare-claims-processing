import React, { useCallback, useMemo } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { useParty } from "@daml/react";
import { routes } from "./config";
import MainLayout from "components/MainLayout";
import { Router } from "react-router";
import { History } from "history";

const defaultRoutePath: { [index: string]: string } = {
  Patient1: "/",
  PrimaryCareProvider: "/",
  Radiologist: "/",
  InsuranceCompany: "/provider/claims",
};

type ChildRouteProps = {
  to: string;
  exact?: boolean;
  view: React.FC;
};

type RouteProps = {
  to: string;
  exact?: boolean;
  roles: string[];
  view?: React.FC;
  childRoutes?: ChildRouteProps[];
};

type RouteComponentProps = {
  setCredentials: (prop: undefined) => void;
  history: History;
};

/**
 * Component that initiates all routes for the authorized party
 * The login route is found within App.tsx
 */
const Routes: React.FC<RouteComponentProps> = ({ setCredentials, history }) => {
  // useParty() return the current authorized user
  const party = useParty();

  const onLogout = useCallback(() => {
    setCredentials(undefined);
    // Go back to main profile page and replace history
    history.replace("");
  }, [history, setCredentials]);

  // Only initiate routes for authorized user
  const privateRoutes = useMemo(() => {
    return routes.filter((route: RouteProps) => route.roles.includes(party));
  }, [party]);

  return (
    <Router history={history}>
      <MainLayout onLogout={onLogout}>
        <div className="min-h-full flex flex-col">
          <Switch>
            {privateRoutes.map((route: RouteProps) => {
              if (route.childRoutes && route.childRoutes.length) {
                return route.childRoutes.map((childRoute: ChildRouteProps) => (
                  <Route
                    key={`child-route-${childRoute.to}-${route.to}`}
                    path={route.to + childRoute.to}
                    exact={childRoute.exact}
                    component={childRoute.view}
                  />
                ));
              }
              return (
                <Route
                  key={`main-route-${route.to}`}
                  path={route.to}
                  exact={route.exact}
                  component={route.view}
                />
              );
            })}
            <Route>
              <Redirect to={defaultRoutePath[party]} />
            </Route>
          </Switch>
        </div>
      </MainLayout>
    </Router>
  );
};

export default Routes;
