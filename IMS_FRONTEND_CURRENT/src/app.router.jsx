import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import FeatureModule from "./feature-module/feature-module";
import { authRoutes, posPages, unAuthRoutes } from "./routes/path";
import { base_path } from "./environment";
import { ToastContainer } from "react-toastify";
import ChatBotFullScreen from "./components/chat";
import "react-toastify/dist/ReactToastify.css";

const AppRouter = () => {
  const RouterContent = React.memo(() => {
    const renderRoutes = (routeList, _isProtected) =>
      routeList?.map((item) => (
        <Route key={`route-${item?.id}`} path={item?.path} element={item?.element} />
      ));

    return (
      <>
        <Routes>
          <Route path="/" element={<FeatureModule />}>
            <Route index element={<Navigate to="/signin" replace />} />
            {renderRoutes(unAuthRoutes, false)}
            {renderRoutes(authRoutes, true)}
            {renderRoutes(posPages, true)}
          </Route>
        </Routes>
      </>
    );
  });

  return (
    <BrowserRouter basename={base_path}>
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Router Content */}
      <RouterContent />

      {/* 🔹 Chatbot floating button (visible globally) */}
      <ChatBotFullScreen />
    </BrowserRouter>
  );
};

export default AppRouter;
