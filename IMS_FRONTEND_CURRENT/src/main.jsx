import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Provider } from "react-redux";
import { PrimeReactProvider } from "primereact/api";
import store from "./core/redux/store";
import AppRouter from "./app.router";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/icons/tabler-icons/tabler-icons.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./assets/icons/feather/css/iconfont.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../src/assets/css/feather.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./customStyle.scss";
import { LazyWrapper } from "./components/lazy-loading";
import "../src/assets/icons/boxicons/css/boxicons.min.css";
import "../node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";

// Global Fetch Interceptor to handle JWT Authorization & Session Timeout
const { fetch: originalFetch } = window;
window.fetch = async (resource, options = {}) => {
  const token = localStorage.getItem("accessToken");
  
  // Clone or initialize headers
  let headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const updatedOptions = {
    ...options,
    headers: headers,
    credentials: options.credentials || "include",
  };

  try {
    const response = await originalFetch(resource, updatedOptions);
    
    // Convert resource to string for checking URL path
    const urlStr = typeof resource === "string" ? resource : (resource?.url || "");
    const isAuthEndpoint = urlStr.includes("/auth/login") || urlStr.includes("/auth/register");
    const isSigninPage = window.location.pathname.includes("/signin") || window.location.pathname.includes("/admin/login");

    if ((response.status === 401 || response.status === 403) && !isAuthEndpoint && !isSigninPage) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("ims_user");
      window.location.href = "/signin";
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PrimeReactProvider
        value={{
          unstyled: false,
          ripple: false,
          hideOverlaysOnDocumentScrolling: true
        }}>

        <LazyWrapper>
          <AppRouter />
        </LazyWrapper>
      </PrimeReactProvider>
    </Provider>
  </StrictMode>
);