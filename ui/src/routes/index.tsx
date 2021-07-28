import React, { useMemo } from "react";
import { Switch, Route } from "react-router-dom";
import { useParty } from "@daml/react";
import { routes } from "./config";
import MainLayout from "components/MainLayout";

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
  onLogout: any;
};

const Routes: React.FC<RouteComponentProps> = ({ onLogout }) => {
  const username = useParty();

  const filteredRoutes: RouteProps[] = useMemo(() => {
    return routes.filter((route: RouteProps) => route.roles.includes(username));
  }, [username]);

  return (
    <MainLayout onLogout={onLogout}>
      <div className="min-h-full flex flex-col">
        <Switch>
          {filteredRoutes.map((route: RouteProps) => {
            if (route.childRoutes && route.childRoutes.length) {
              return route.childRoutes.map((childRoute: ChildRouteProps) => (
                <Route
                  key={`child-route-${childRoute.to}-${route.to}`}
                  path={route.to + childRoute.to}
                  exact={childRoute.exact}
                >
                  {childRoute.view}
                </Route>
              ));
            }
            return (
              <Route
                key={`main-route-${route.to}`}
                path={route.to}
                exact={route.exact}
              >
                {route.view}
              </Route>
            );
          })}
        </Switch>
      </div>
    </MainLayout>
  );
};

export default Routes;
