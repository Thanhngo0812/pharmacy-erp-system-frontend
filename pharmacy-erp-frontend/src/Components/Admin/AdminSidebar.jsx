import "../scss/AdminSidebar.scss";
import { FaBoxOpen, FaChartLine, FaUsers } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import logo from "../../../public/vite.svg";

export default function AdminSidebar({ openSidebar }) {
  const menuList = [
    { path: "", name: "Dashboard", icon: <FaChartLine /> },
    { path: "product", name: "Products", icon: <FaBoxOpen /> },
    { path: "user", name: "Users", icon: <FaUsers /> },
  ];
  return (
    <div className={`sidebar-container ${openSidebar ? "" : "close"}`}>
      <Link to="/admin" className="sidebar-header">
        <img src={logo} alt="Logo Admin" className="logo" />
        <h2 className="title" style={{ display: openSidebar ? "" : "none" }}>
          Pharmacy
        </h2>
      </Link>

      <div className="menu-list">
        {menuList.map((item) => (
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
