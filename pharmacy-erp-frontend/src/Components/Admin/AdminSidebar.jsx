import "../scss/AdminSidebar.scss";
import { FaBoxOpen, FaChartLine, FaUsers, FaTimes } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import logo from "/logo.png";
import { useContext } from "react";
import { AuthContext } from "../../store/AuthContext";

export default function AdminSidebar({
  openSidebar,
  showSidebar,
  toggleSidebar,
}) {
  const menuList = [
    {
      path: "",
      name: "Dashboard",
      icon: <FaChartLine />,
      require_role: ["ROLE_ADMIN"],
    },
    {
      path: "product",
      name: "Products",
      icon: <FaBoxOpen />,
      require_role: ["ROLE_ADMIN"],
    },
    {
      path: "user",
      name: "Users",
      icon: <FaUsers />,
      require_role: ["ROLE_ADMIN"],
    },
    {
      path: "account",
      name: "Accounts",
      icon: <FaChartLine />,
      require_role: ["ROLE_ADMIN"],
    },
    {
      path: "profile",
      name: "Profile",
      icon: <FaBoxOpen />,
      require_role: ["ROLE_WM"],
    },
    {
      path: "salary",
      name: "Salary",
      icon: <FaUsers />,
      require_role: ["ROLE_SS"],
    },
  ];
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  const menuListAfterCheckRole = menuList.filter((tab) =>
    user.roles.some((item) => tab.require_role.includes(item)),
  );
  return (
    <>
      {showSidebar && (
        // man mau den hien thi duoi sidebar
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      <div
        className={`sidebar-container ${openSidebar ? "" : "close"} ${showSidebar ? "show-mobile" : ""}`}
      >
        {showSidebar && (
          <FaTimes className="icon-close-sidebar" onClick={toggleSidebar} />
        )}
        <Link to="/admin" className="sidebar-header">
          <img src={logo} alt="Logo Admin" className="logo-image" />
          <div>
            <h3
              className="title"
              style={{ display: openSidebar ? "" : "none", color: "white" }}
            >
              Pharmacy
            </h3>
            <h3
              className="title"
              style={{ display: openSidebar ? "" : "none", color: "#D9251B" }}
            >
              ERP
            </h3>
            <h3
              className="title"
              style={{ display: openSidebar ? "" : "none", color: "#00583B" }}
            >
              System
            </h3>
          </div>
        </Link>

        <div className="menu-list">
          {menuListAfterCheckRole.map((item) => (
            <NavLink
              to={item.path}
              end
              key={item.path}
              className={({ isActive }) =>
                isActive ? "menu-items active" : "menu-items"
              }
            >
              <div className="icon">{item.icon}</div>
              <div
                className="name"
                style={{ display: openSidebar ? "" : "none" }}
              >
                {item.name}
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
