import { useSelector } from "react-redux";
import { Outlet, useLocation, matchPath } from "react-router";
import Header from "../components/header";
import Sidebar from "../components/sidebar";

import { authRoutes, posPages, unAuthRoutes } from "../routes/path";
import { useEffect } from "react";
import TwoColumnSidebar from "../components/layouts/two-column";
import HorizontalSidebar from "../components/layouts/horizontalSidebar";
import PosHeader from "./pos/posHeader";

const FeatureModule = () => {
  const location = useLocation();
  const { toggleHeader } = useSelector((state) => state.sidebar);
  const data = useSelector((state) => state.rootReducer.toggle_header);
  const dataWidth = useSelector((state) => state.themeSetting.dataWidth);
  const dataLayout = useSelector((state) => state.themeSetting.dataLayout);
  const dataSidebarAll = useSelector((state) => state.themeSetting.dataSidebarAll);
  const dataColorAll = useSelector((state) => state.themeSetting.dataColorAll);
  const dataTopBarColorAll = useSelector((state) => state.themeSetting.dataTopBarColorAll);
  const dataTopbarAll = useSelector((state) => state.themeSetting.dataTopbarAll);

  // 👇 Keep only scroll behavior
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isUnAuthRoute = unAuthRoutes.some((route) =>
    matchPath({ path: typeof route === "string" ? route : route.path, end: true }, location.pathname)
  );
  const isPosPage = posPages.some((route) =>
    matchPath({ path: typeof route === "string" ? route : route.path, end: true }, location.pathname)
  );
  const isAuthRoute = authRoutes.some((route) =>
    matchPath({ path: typeof route === "string" ? route : route.path, end: true }, location.pathname)
  );

  if (isUnAuthRoute) {
    return <Outlet />;
  }

  if (isPosPage) {
    return (
      <div className={`main-wrapper ${toggleHeader ? "header-collapse" : ""}`}>
        <PosHeader />
        <Outlet />
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className={`main-wrapper ${toggleHeader ? "header-collapse" : ""}`}>
        <style>{`
          :root {
            --sidebar--rgb-picr: ${dataSidebarAll};
            --topbar--rgb-picr: ${dataTopbarAll};
            --topbarcolor--rgb-picr: ${dataTopBarColorAll};
            --primary-rgb-picr: ${dataColorAll};
          }
        `}</style>

        <div
          className={`
            ${dataLayout === "mini" || dataLayout === "layout-hovered" || dataWidth === "box" ? "mini-sidebar" : ""}
            ${dataLayout.startsWith("horizontal") ? "menu-horizontal" : ""}
            ${dataWidth === "box" ? "layout-box-mode" : ""}
          `}
        >
          <div className={`main-wrapper ${data ? "header-collapse" : ""}`}>
            <Header />
            <Sidebar />
            <TwoColumnSidebar />
            <HorizontalSidebar />
            <div style={{ paddingTop: "100px" }}>
              <Outlet />
            </div>

          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default FeatureModule;
