import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarData } from "../../core/json/siderbar_data";
import { useSelector } from "react-redux";
import { all_routes } from "../../routes/all_routes";
import { customer15, logo, logoWhite } from "../../utils/imagepath";
import iatt from "../../assets/img/Front (1).png";
import logoSmall from "../../assets/img/favicon.png";

const Sidebar = () => {
  const route = all_routes;
  const Location = useLocation();

  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");

  const toggleSidebar = (title) => {
    if (title === subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem) => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };

  const [toggle, setToggle] = useState(false);
  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    setToggle((current) => !current);
  };

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
      <div
        className={`sidebar ${toggle ? "" : "active"} ${expandMenus || dataLayout === "layout-hovered" ? "expand-menu" : ""
          }`}
        id="sidebar"
        onMouseLeave={expandMenu}
        onMouseOver={expandMenuOpen}
        style={{ backgroundColor: "#1E3A8A" }}
      >
        <>
          {/* Logo */}
          <div className="sidebar-logo">
            <Link to={route.newdashboard} className="logo logo-normal">
              <img src={iatt} alt="Img" />
            </Link>
            <Link to={route.newdashboard} className="logo logo-white">
              <img
                src={iatt}
                alt="Img"
                style={{ width: "180px", height: "80px" }}
              />
            </Link>
            <Link to={route.newdashboard} className="logo-small">
              <img src={iatt} alt="Img" />
            </Link>
            <Link id="toggle_btn" to="#" onClick={handlesidebar}>
              <i
                className="feather icon-chevrons-left feather-16"
                style={{ color: "white" }}
              />
            </Link>
          </div>
          {/* /Logo */}
          <div className="modern-profile p-3   pb-0">
            <div
              className="text-center rounded bg-dark p-3 mb-4 border"
              style={{ borderColor: "white" }}
            >
              <div className="avatar avatar-lg online mb-3">
                <img
                  src={iatt}
                  alt="Img"
                  className="img-fluid rounded-circle"
                />
              </div>
              <h6 className="fs-14 fw-bold mb-1" style={{ color: "white" }}>
                Adrian Herman
              </h6>
              <p className="fs-12 mb-0" style={{ color: "white" }}>
                System Admin
              </p>
            </div>
            <div className="sidebar-nav mb-3">
              <ul
                className="nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent"
                role="tablist"
              >
                <li className="nav-item">
                  <Link
                    className="nav-link active border-0"
                    to="#"
                    style={{ color: "white", backgroundColor: "#2A4B9B" }}
                  >
                    Menu
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link border-0"
                    to={route.chat}
                    style={{ color: "white" }}
                  >
                    Chats
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link border-0"
                    to={route.email}
                    style={{ color: "white" }}
                  >
                    Inbox
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="sidebar-header p-3 pb-0 pt-2">
            <div
              className="text-center rounded bg-dark p-2 mb-4 sidebar-profile d-flex align-items-center"
              style={{ borderColor: "white" }}
            >
              <div className="avatar avatar-md onlin">
                <img
                  src={iatt}
                  alt="Img"
                  className="img-fluid rounded-circle"
                />
              </div>
              <div className="text-start sidebar-profile-info ms-2">
                <h6 className="fs-14 fw-bold mb-1" style={{ color: "white" }}>
                  Adrian Herman
                </h6>
                <p className="fs-12" style={{ color: "white" }}>
                  System Admin
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between menu-item mb-3">
              <div>
                <Link
                  to={route.newdashboard}
                  className="btn btn-sm btn-icon bg-dark"
                  style={{ color: "white" }}
                >
                  <i
                    className="ti ti-layout-grid-remove"
                    style={{ color: "white" }}
                  />
                </Link>
              </div>
              <div>
                <Link
                  to={route.chat}
                  className="btn btn-sm btn-icon bg-dark"
                  style={{ color: "white" }}
                >
                  <i
                    className="ti ti-brand-hipchat"
                    style={{ color: "white" }}
                  />
                </Link>
              </div>
              <div>
                <Link
                  to={route.email}
                  className="btn btn-sm btn-icon bg-dark position-relative"
                  style={{ color: "white" }}
                >
                  <i className="ti ti-message" style={{ color: "white" }} />
                </Link>
              </div>
              <div className="notification-item">
                <Link
                  to={route.activities}
                  className="btn btn-sm btn-icon bg-dark position-relative"
                  style={{ color: "white" }}
                >
                  <i className="ti ti-bell" style={{ color: "white" }} />
                  <span
                    className="notification-status-dot"
                    style={{ backgroundColor: "red" }}
                  />
                </Link>
              </div>
              <div className="me-0">
                <Link
                  to={route.generalsettings}
                  className="btn btn-sm btn-icon bg-dark"
                  style={{ color: "white" }}
                >
                  <i className="ti ti-settings" style={{ color: "white" }} />
                </Link>
              </div>
            </div>
          </div>
          <div data-simplebar="">
            <div className="sidebar-inner">
              <div id="sidebar-menu" className="sidebar-menu">
                <ul>
                  {SidebarData?.map((mainLabel, index) => (
                    <li className="submenu-open" key={index}>
                      <h6 className="submenu-hdr" style={{ color: "white" }}>
                        {mainLabel?.label}
                      </h6>
                      <ul>
                        {mainLabel?.submenuItems?.map((title, i) => {
                          let link_array = [];
                          title?.submenuItems?.map((link) => {
                            link_array.push(link?.link);
                            if (link?.submenu) {
                              link?.submenuItems?.map((item) => {
                                link_array.push(item?.link);
                              });
                            }
                            return link_array;
                          });
                          title.links = link_array;
                          return (
                            <React.Fragment key={i}>
                              <li
                                className={`submenu ${!title?.submenu &&
                                  Location.pathname === title?.link
                                  ? "custom-active-hassubroute-false"
                                  : ""
                                  }`}
                              >
                                <Link
                                  to={title?.link}
                                  onClick={() => toggleSidebar(title?.label)}
                                  className={`${subOpen === title?.label ? "subdrop" : ""
                                    } ${title?.links?.includes(Location.pathname)
                                      ? "active"
                                      : ""
                                    }`}
                                  style={{ color: "white" }}
                                >
                                  <i
                                    className={`ti ti-${title.icon} me-2`}
                                    style={{ color: "white" }}
                                  ></i>
                                  <span
                                    className="custom-active-span"
                                    style={{ color: "white" }}
                                  >
                                    {title?.label}
                                  </span>
                                  {title?.submenu && (
                                    <span
                                      className="menu-arrow"
                                      style={{
                                        borderColor:
                                          "white transparent transparent transparent",
                                      }}
                                    />
                                  )}
                                </Link>
                                <ul
                                  style={{
                                    display:
                                      subOpen === title?.label
                                        ? "block"
                                        : "none",
                                  }}
                                >
                                  {title?.submenuItems?.map(
                                    (item, titleIndex) => (
                                      <li
                                        className="submenu submenu-two"
                                        key={titleIndex}
                                      >
                                        <Link
                                          to={item?.link}
                                          className={`${item?.submenuItems
                                            ?.map((link) => link.link)
                                            .includes(Location.pathname) ||
                                            item?.link === Location.pathname
                                            ? "active"
                                            : ""
                                            } ${subsidebar === item?.label
                                              ? "subdrop"
                                              : ""
                                            }`}
                                          onClick={() =>
                                            toggleSubsidebar(item?.label)
                                          }
                                          style={{ color: "white" }}
                                        >
                                          {item?.label}
                                          {item?.submenu && (
                                            <span
                                              className="menu-arrow inside-submenu"
                                              style={{
                                                borderColor:
                                                  "white transparent transparent transparent",
                                              }}
                                            />
                                          )}
                                        </Link>
                                        <ul
                                          style={{
                                            display:
                                              subsidebar === item?.label
                                                ? "block"
                                                : "none",
                                          }}
                                        >
                                          {item?.submenuItems?.map(
                                            (items, subIndex) => (
                                              <li key={subIndex}>
                                                <Link
                                                  to={items?.link}
                                                  className={`${subsidebar === items?.label
                                                    ? "submenu-two subdrop"
                                                    : "submenu-two"
                                                    } ${items?.submenuItems
                                                      ?.map((link) => link.link)
                                                      .includes(
                                                        Location.pathname
                                                      ) ||
                                                      items?.link ===
                                                      Location.pathname
                                                      ? "active"
                                                      : ""
                                                    }`}
                                                  style={{ color: "white" }}
                                                >
                                                  {items?.label}
                                                </Link>
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </li>
                            </React.Fragment>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      </div>
      <style>{`
  /* --- Sidebar Hover, Glassy Effect & Logo Animation --- */

  /* Submenu link style */
  .sidebar-menu ul li ul li a {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.35s ease;
    border-radius: 10px;
    overflow: hidden;
  }

  .sidebar-menu ul li ul li a i {
    transition: all 0.35s ease;
    transform-origin: center;
  }

  /* Hover glassy animation */
  .sidebar-menu ul li ul li a:hover {
    background: rgba(255, 255, 255, 0.25);
    color: #000 !important;
    transform: translateX(6px);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.35);
  }

  /* Icon animation */
  .sidebar-menu ul li ul li a:hover i {
    color: #000 !important;
    transform: scale(1.2) rotate(10deg);
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
  }

  /* Glow strip */
  .sidebar-menu ul li ul li a:hover::before {
    content: "";
    position: absolute;
    left: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 60%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.4)
    );
    border-radius: 2px;
    animation: glow 0.5s ease-in-out;
  }

  /* Shimmer reflection */
  .sidebar-menu ul li ul li a::after {
    content: "";
    position: absolute;
    top: 0;
    left: -80%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: skewX(-20deg);
    transition: all 0.6s ease;
  }

  .sidebar-menu ul li ul li a:hover::after {
    left: 120%;
  }

  /* --- LOGO ANIMATION --- */
  .sidebar-logo img {
    width: 100%;
    max-width: 140px;
    transition: all 0.6s ease;
    animation: logoPulse 4s infinite ease-in-out;
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
  }

  .sidebar-logo img:hover {
    transform: scale(1.08) rotate(2deg);
    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.7));
  }

  @keyframes logoPulse {
    0%,
    100% {
      transform: scale(1);
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.3));
    }
    50% {
      transform: scale(1.05);
      filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.6));
    }
  }

  /* --- Scrollbar Styling --- */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #575757ff, #575757ff);
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #bfdbfe, #60a5fa);
  }

  /* --- Keyframes --- */
  @keyframes glow {
    from {
      opacity: 0;
      transform: scaleY(0.5) translateY(-50%);
    }
    to {
      opacity: 1;
      transform: scaleY(1) translateY(-50%);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse-slow {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
    }
    50% {
      opacity: 0.85;
      box-shadow: 0 0 25px rgba(255, 255, 255, 0.6);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }
  .animate-slideUp {
    animation: slideUp 0.5s ease-out forwards;
  }
  .animation-delay-100 {
    animation-delay: 0.1s;
  }
  .animate-pulse-slow {
    animation: pulse-slow 3s infinite;
  }
`}</style>

    </>
  );
};

export default Sidebar;
