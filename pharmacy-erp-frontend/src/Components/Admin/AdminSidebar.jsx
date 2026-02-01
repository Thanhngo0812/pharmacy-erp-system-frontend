import "../scss/AdminSidebar.scss";
import { FaBoxOpen, FaChartLine, FaUsers } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import logo from "../../../public/vite.svg";
import { useContext } from "react";
import { AuthContext } from "../../store/AuthContext";

export default function AdminSidebar({ openSidebar }) {
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
      require_role: ["ROLE_ADMIN"],
    },
    {
      path: "salary",
      name: "Salary",
      icon: <FaUsers />,
      require_role: ["ROLE_USER"],
    },
  ];
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  const menuListAfterCheckRole = menuList.filter((tab) =>
    user.roles.some((item) => tab.require_role.includes(item)),
  );
  return (
    <div className={`sidebar-container ${openSidebar ? "" : "close"}`}>
      <Link to="/admin" className="sidebar-header">
        <img src={logo} alt="Logo Admin" className="logo" />
        <h2 className="title" style={{ display: openSidebar ? "" : "none" }}>
          Pharmacy
        </h2>
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
  );
}
