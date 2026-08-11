import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { all_routes } from "../../routes/all_routes";
import {
  arabicFlag,
  avatar01,
  avatar1,
  avatar10,
  avatar_02,
  avatar_03,
  avatar_13,
  avatar_17,
  avator1,
  commandSvg,
  englishFlag,
  iatlogo,
  store_01,
  store_02,
  store_03,
  store_04,
  usFlag,
} from "../../utils/imagepath";

const Header = () => {
  const route = all_routes;
  const [toggle, SetToggle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flagImage, _setFlagImage] = useState(usFlag);
  const overlayRef = useRef(null);
  const location = useLocation();

  const changeLanguage = (_lng) => {
    // Placeholder for language change logic
  };

  const isElementVisible = (element) => {
    return element.offsetWidth > 0 || element.offsetHeight > 0;
  };

  // Prevent hover issues when sidebar is mini
  useEffect(() => {
    const handleMouseover = (e) => {
      e.stopPropagation();
      const body = document.body;
      const toggleBtn = document.getElementById("toggle_btn");
      if (
        body.classList.contains("mini-sidebar") &&
        isElementVisible(toggleBtn)
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("mouseover", handleMouseover);
    return () => {
      document.removeEventListener("mouseover", handleMouseover);
    };
  }, []);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
    };
    const events = [
      "fullscreenchange",
      "mozfullscreenchange",
      "webkitfullscreenchange",
      "msfullscreenchange",
    ];
    events.forEach((ev) =>
      document.addEventListener(ev, handleFullscreenChange)
    );
    return () => {
      events.forEach((ev) =>
        document.removeEventListener(ev, handleFullscreenChange)
      );
    };
  }, []);

  // Toggle mini-sidebar
  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    SetToggle((current) => !current);
  };

  // Toggle mobile sidebar overlay
  const sidebarOverlay = () => {
    const wrapper = document.querySelector(".main-wrapper");
    const overlay = document.querySelector(".sidebar-overlay");
    const html = document.querySelector("html");

    wrapper?.classList.toggle("slide-nav");
    overlay?.classList.toggle("opened");
    html?.classList.toggle("menu-opened");
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const overlay = overlayRef.current;
      const sidebar = document.querySelector(".sidebar");
      const mobileBtn = document.getElementById("mobile_btn");

      if (
        overlay?.classList.contains("opened") &&
        !sidebar?.contains(e.target) &&
        !mobileBtn?.contains(e.target)
      ) {
        sidebarOverlay();
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Reset sidebar on route change
  useEffect(() => {
    const wrapper = document.querySelector(".main-wrapper");
    const overlay = document.querySelector(".sidebar-overlay");
    const html = document.querySelector("html");

    wrapper?.classList.remove("slide-nav");
    overlay?.classList.remove("opened");
    html?.classList.remove("menu-opened");
  }, [location.pathname]);

  // Exclude specific pages
  const exclusionArray = ["/dream-pos/index-three", "/dream-pos/index-one"];
  if (exclusionArray.includes(window.location.pathname)) {
    return null;
  }

  // Fullscreen toggle function
  const toggleFullscreen = (elem) => {
    const doc = document;
    elem = elem || doc.documentElement;

    if (
      !doc.fullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.msFullscreenElement
    ) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  // Redux selectors (kept for completeness)
  const { expandMenus } = useSelector(
    (state) => state.themeSetting.expandMenus
  );
  const dataLayout = useSelector((state) => state.themeSetting.dataLayout);

  const expandMenu = () => {
    document.body.classList.remove("expand-menu");
  };
  const expandMenuOpen = () => {
    document.body.classList.add("expand-menu");
  };

  return (
    <>
      {/* Sidebar Overlay */}
      <div
        ref={overlayRef}
        className="sidebar-overlay"
        onClick={sidebarOverlay}
      />

      {/* Main Header */}
      <div className="fixed top-0 inset-x-0 z-50 h-16 bg-base-200/80 backdrop-blur-md border-b border-base-300 flex items-center justify-between px-4 md:px-6">

        {/* LEFT: Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            id="mobile_btn"
            className="lg:hidden"
            onClick={sidebarOverlay}
          >
            <span className="flex flex-col gap-1 border-2 border-base-content/20 p-1 rounded">
              <span className="w-5 h-0.5 bg-black" />
              <span className="w-5 h-0.5 bg-black" />
              <span className="w-5 h-0.5 bg-black" />
            </span>
          </button>
        </div>

        {/* CENTER: Logo (≤1320px) | Title (≥1321px) */}
        <div className="flex-1 flex justify-center items-center">
          {/* IAT Logo – visible up to 1320px */}
          <div className="max-[991px]:flex hidden justify-center w-full">
            <Link to="/index">
              <img src={iatlogo} alt="IAT Logo" className="h-16 w-auto" />
            </Link>
          </div>

          {/* Full Title – visible from 1321px onward */}
          <div className="min-[1321px]:block hidden text-center">
            <h1 className="text-base lg:text-lg font-bold text-gray-800 max-w-[320px] mx-auto truncate">
              Inventory Management System
            </h1>
          </div>
        </div>

        {/* RIGHT: Search + Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search */}
          <div className="top-nav-search">
            {/* Mobile Search Icon */}
            <button className="md:hidden p-2 rounded-lg hover:bg-base-300 transition-colors">
              <i className="feather icon-search text-lg" />
            </button>

            {/* Desktop Search */}
            <form action="#" className="hidden md:block dropdown">
              <div
                className="flex items-center searchinputs input-group dropdown-toggle rounded-lg bg-base-100 focus-within:ring-2 focus-within:ring-primary transition-shadow"
                id="dropdownMenuClickable"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
              >
                <input
                  type="text"
                  placeholder="Search"
                  className="flex-1 px-4 py-2 bg-transparent text-sm focus:outline-none"
                />
                <div className=" p-2 cursor-pointer hover:bg-base-300/50 transition-colors">
                  <span>
                    <i className="ti ti-search text-lg" />
                  </span>
                </div>
                <span className="input-group-text px-3 py-2 bg-base-300/50 rounded-r-lg">
                  <kbd className="flex items-center  text-xs">
                    <img src={commandSvg} alt="cmd" className="w-4 h-4 me-1" />K
                  </kbd>
                </span>
              </div>

              {/* Search Dropdown */}
              <div
                className="dropdown-menu search-dropdown mt-1 w-96 rounded-lg shadow-lg bg-base-100 border border-base-300 p-4"
                aria-labelledby="dropdownMenuClickable"
              >
                {/* Recent Searches */}
                <div className="search-info mb-4">
                  <h6 className="flex items-center gap-2 text-sm font-medium">
                    <span>
                      <i className="feather icon-search text-base" />
                    </span>
                    Recent Searches
                  </h6>
                  <ul className="flex flex-wrap gap-2 mt-2 search-tags">
                    <li>
                      <Link
                        to="#"
                        className="px-3 py-1 rounded-full bg-base-200 hover:bg-base-300 transition-colors text-sm"
                      >
                        Products
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="px-3 py-1 rounded-full bg-base-200 hover:bg-base-300 transition-colors text-sm"
                      >
                        Sales
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="px-3 py-1 rounded-full bg-base-200 hover:bg-base-300 transition-colors text-sm"
                      >
                        Applications
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Help */}
                <div className="search-info mb-4">
                  <h6 className="flex items-center gap-2 text-sm font-medium">
                    <span>
                      <i className="feather-16 feather icon-help-circle" />
                    </span>
                    Help
                  </h6>
                  <p className="text-sm text-base-content/70 mt-1">
                    How to Change Product Volume from 0 to 200 on Inventory
                    management
                  </p>
                  <p className="text-sm text-base-content/70">
                    Change Product Name
                  </p>
                </div>

                {/* Customers */}
                <div className="search-info">
                  <h6 className="flex items-center gap-2 text-sm font-medium">
                    <span>
                      <i className="feather icon-user text-base" />
                    </span>
                    Customers
                  </h6>
                  <ul className="space-y-2 customers mt-2">
                    <li>
                      <Link
                        to="#"
                        className="flex items-center justify-between hover:bg-base-200 p-2 rounded-lg transition-colors"
                      >
                        Aron Varu
                        <img
                          src={avatar1}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="flex items-center justify-between hover:bg-base-200 p-2 rounded-lg transition-colors"
                      >
                        Jonita
                        <img
                          src={avatar01}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="flex items-center justify-between hover:bg-base-200 p-2 rounded-lg transition-colors"
                      >
                        Aaron
                        <img
                          src={avatar10}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </form>
          </div>

          {/* Desktop Icons */}
          <ul className="hidden md:flex items-center gap-2 md:gap-4">
            {/* Fullscreen */}
            <li className="nav-item-box">
              <button
                id="btnFullscreen"
                onClick={() => toggleFullscreen()}
                className="p-2 rounded-lg hover:bg-base-300 transition-colors"
              >
                <i className="ti ti-maximize text-lg"></i>
              </button>
            </li>

            {/* Email */}
            <li className="nav-item-box relative">
              <Link
                to="/email"
                className="p-2 rounded-lg hover:bg-base-300 transition-colors"
              >
                <i className="ti ti-mail text-lg"></i>
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  1
                </span>
              </Link>
            </li>

            {/* Notifications */}
            <li className="dropdown nav-item-box">
              <Link
                to="#"
                className="p-2 rounded-lg hover:bg-base-300 transition-colors dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-bell text-lg"></i>
              </Link>
              <div className="dropdown-menu notifications w-80 md:w-96 rounded-lg shadow-lg bg-base-100 border border-base-300">
                <div className="topnav-dropdown-header flex items-center justify-between p-4 border-b border-base-300">
                  <h5 className="notification-title text-base font-medium">
                    Notifications
                  </h5>
                  <Link
                    to="#"
                    className="clear-noti text-sm text-primary hover:underline"
                  >
                    Mark all as read
                  </Link>
                </div>
                <div className="noti-content max-h-96 overflow-y-auto p-4">
                  <ul className="notification-list space-y-3">
                    <li className="notification-message">
                      <Link to={route.activities}>
                        <div className="flex gap-3">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src={avatar_13}
                              className="w-10 h-10 rounded-full"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details text-sm">
                              <span className="noti-title font-medium">
                                James Kirwin
                              </span>{" "}
                              confirmed his order. Order No: #78901. Estimated
                              delivery: 2 days
                            </p>
                            <p className="noti-time text-xs text-base-content/70">
                              4 mins ago
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>

                    <li className="notification-message">
                      <Link to={route.activities}>
                        <div className="flex gap-3">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src={avatar_03}
                              className="w-10 h-10 rounded-full"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details text-sm">
                              <span className="noti-title font-medium">
                                Leo Kelly
                              </span>{" "}
                              cancelled his order scheduled for 17 Jan 2025
                            </p>
                            <p className="noti-time text-xs text-base-content/70">
                              10 mins ago
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>

                    <li className="notification-message">
                      <Link to={route.activities} className="recent-msg">
                        <div className="flex gap-3">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src={avatar_17}
                              className="w-10 h-10 rounded-full"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details text-sm">
                              Payment of $50 received for Order #67890 from{" "}
                              <span className="noti-title font-medium">
                                Antonio Engle
                              </span>
                            </p>
                            <p className="noti-time text-xs text-base-content/70">
                              05 mins ago
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>

                    <li className="notification-message">
                      <Link to={route.activities} className="recent-msg">
                        <div className="flex gap-3">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src={avatar_02}
                              className="w-10 h-10 rounded-full"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details text-sm">
                              <span className="noti-title font-medium">
                                Andrea
                              </span>{" "}
                              confirmed his order. Order No: #73401. Estimated
                              delivery: 3 days
                            </p>
                            <p className="noti-time text-xs text-base-content/70">
                              4 mins ago
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="topnav-dropdown-footer flex gap-2 p-4 border-t border-base-300">
                  <Link
                    to="#"
                    className="btn btn-secondary flex-1 text-sm py-2"
                  >
                    Cancel
                  </Link>
                  <Link
                    to={route.activities}
                    className="btn btn-primary flex-1 text-sm py-2"
                  >
                    View all
                  </Link>
                </div>
              </div>
            </li>

            {/* Settings */}
            <li className="nav-item-box">
              <Link
                to="/general-settings"
                className="p-2 rounded-lg hover:bg-base-300 transition-colors"
              >
                <i className="feather icon-settings text-lg"></i>
              </Link>
            </li>

<li className="nav-item dropdown">
  <a
    href="#"
    className="nav-link dropdown-toggle d-flex align-items-center p-1 rounded"
    id="userDropdown"
    role="button"
    data-bs-toggle="dropdown"
    aria-expanded="false"
  >
  </a>

  <ul
    className="dropdown-menu dropdown-menu-end shadow border-1 mt-2"
    aria-labelledby="userDropdown"
  >
    <li className="px-3 py-2 border-bottom d-flex align-items-center">
      <img
        src={avator1}
        alt="Img"
        className="rounded-circle me-2"
        width="45"
        height="45"
      />
      <div>
        <h6 className="mb-0 fw-semibold">Prem Kumar</h6>
        <small className="text-muted">Admin</small>
      </div>
    </li>

    <li>
      <Link className="dropdown-item d-flex align-items-center py-2" to={route.profile}>
        <i className="ti ti-user-circle me-2"></i> My Profile
      </Link>
    </li>

    <li>
      <Link className="dropdown-item d-flex align-items-center py-2" to={route.salesreport}>
        <i className="ti ti-file-text me-2"></i> Reports
      </Link>
    </li>

    <li>
      <Link className="dropdown-item d-flex align-items-center py-2" to={route.generalsettings}>
        <i className="ti ti-settings-2 me-2"></i> Settings
      </Link>
    </li>

    <li><hr className="dropdown-divider" /></li>

    <li>
      <Link
        className="dropdown-item d-flex align-items-center text-danger py-2"
        to={route.signin}
      >
        <i className="ti ti-logout me-2"></i> Logout
      </Link>
    </li>
  </ul>
</li>

          </ul>

          {/* Mobile More Dropdown */}
          <div className="md:hidden dropdown">
            <i
              className="fa fa-ellipsis-v text-lg p-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            />
            <div className="dropdown-menu dropdown-menu-right w-48 rounded-lg shadow-lg bg-base-100 border border-base-300">
              <button
                onClick={() => toggleFullscreen()}
                className="dropdown-item flex items-center gap-2 p-3 hover:bg-base-200 transition-colors"
              >
                <i className="ti ti-maximize text-lg" />
                Fullscreen
              </button>
              <Link
                className="dropdown-item flex items-center gap-2 p-3 hover:bg-base-200 transition-colors"
                to="/email"
              >
                <i className="ti ti-mail text-lg" />
                Email
              </Link>
              <Link
                className="dropdown-item flex items-center gap-2 p-3 hover:bg-base-200 transition-colors"
                to={route.activities}
              >
                <i className="ti ti-bell text-lg" />
                Notifications
              </Link>
              <Link
                className="dropdown-item flex items-center gap-2 p-3 hover:bg-base-200 transition-colors"
                to="/general-settings"
              >
                <i className="feather icon-settings text-lg" />
                Settings
              </Link>
              <Link
                className="dropdown-item flex items-center gap-2 p-3 hover:bg-base-200 transition-colors"
                to={route.profile}
              >
                <i className="ti ti-user-circle text-lg" />
                Profile
              </Link>
              <hr className="my-2 border-base-300" />
              <Link
                className="dropdown-item flex items-center gap-2 p-3 hover:bg-base-200 transition-colors text-red-600"
                to={route.signin}
              >
                <i className="ti ti-logout text-lg" />
                Logout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;