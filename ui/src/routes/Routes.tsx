import React, { useCallback, useMemo } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { routes } from "routes/config";
import MainLayout from "components/MainLayout";
import { Router } from "react-router";
import { History } from "history";
import { cookieName } from "config/config";
import { deleteCookie } from "utils";

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
  useParty: () => string;
};

/**
 * Component that initiates all routes for the authorized party
 * The login route is found within App.tsx
 */
const Routes: React.FC<RouteComponentProps> = ({
  setCredentials,
  history,
  useParty,
}) => {
  // useParty() return the current authorized user
  const party = useParty();

  const onLogout = useCallback(() => {
    // Remove all cookies and token related to authentication
    deleteCookie({
      name: cookieName,
    });
    localStorage.removeItem("daml.token");
    localStorage.removeItem("daml.token");

    setCredentials(undefined);
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
