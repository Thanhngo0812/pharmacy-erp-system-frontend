import "../scss/AdminSidebar.scss";
import { FaBoxOpen, FaChartLine, FaUsers } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const menuList = [
    { path: "", name: "Dashboard", icon: <FaChartLine /> },
    { path: "product", name: "Products", icon: <FaBoxOpen /> },
    { path: "user", name: "Users", icon: <FaUsers /> },
  ];
  return (
    <div className="sidebar-container">
      <Link to="/admin">
        <h2 className="title">Pharmacy</h2>
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
            <div className="name">{item.name}</div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
