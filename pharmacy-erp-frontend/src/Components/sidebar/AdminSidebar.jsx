import "./AdminSidebar.scss";
import { FaBoxOpen, FaChartLine, FaUsers, FaChevronRight, FaAddressCard, FaUserCheck, FaBriefcase, FaCalendarCheck, FaMoneyBillWave, FaGift } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import logo from "/logo.png";
import { useContext, useState } from "react";
import { AuthContext } from "../../store/AuthContext";

export default function AdminSidebar({ openSidebar }) {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (path) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const menuList = [
    {
      path: "dashboard",
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
      path: "employees-group",
      name: "Nhân sự",
      icon: <FaUsers />,
      require_role: ["ROLE_ADMIN", "ROLE_HM"],
      children: [
        {
          path: "employees",
          name: "Thông tin nhân sự",
          icon: <FaAddressCard />,
          require_role: ["ROLE_ADMIN", "ROLE_HM"],
        },
        {
          path: "positions",
          name: "Chức vụ",
          icon: <FaBriefcase />,
          require_role: ["ROLE_ADMIN", "ROLE_HM"],
        },
        {
          path: "employees/leave-approvals",
          name: "Duyệt nghỉ phép",
          icon: <FaCalendarCheck />,
          require_role: ["ROLE_ADMIN", "ROLE_HM"],
        },
        {
          path: "employees/income",
          name: "Lương",
          icon: <FaMoneyBillWave />,
          require_role: ["ROLE_ADMIN", "ROLE_HM"],
        },
      ]
    },
    {
      path: "account",
      name: "Accounts",
      icon: <FaChartLine />,
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
  const menuListAfterCheckRole = menuList
    .filter((tab) => {
      // If require_role is empty, allow all roles
      if (!tab.require_role || tab.require_role.length === 0) return true;
      if (!user.roles) return false;
      return user.roles.some((item) => tab.require_role.includes(item));
    })
    .map((tab) => {
      if (tab.children) {
        return {
          ...tab,
          children: tab.children.filter((child) => {
            if (!child.require_role || child.require_role.length === 0) return true;
            if (!user.roles) return false;
            return user.roles.some((item) => child.require_role.includes(item));
          }),
        };
      }
      return tab;
    });
  return (
    <div className={`sidebar-container ${openSidebar ? "" : "close"}`}>
      <Link to="/admin" className="sidebar-header">
        <img src={logo} alt="Logo Admin" className="logo-image" />
        <div>
          <h3 className="title" style={{ display: openSidebar ? "" : "none", color: 'white' }}>
            Pharmacy
          </h3>
          <h3 className="title" style={{ display: openSidebar ? "" : "none", color: '#D9251B' }}>
            ERP
          </h3>
          <h3 className="title" style={{ display: openSidebar ? "" : "none", color: '#00583B' }}>
            System
          </h3>
        </div>
      </Link>

      <div className="menu-list">
        {menuListAfterCheckRole.map((item) => (
          <div key={item.path} className="menu-item-wrapper">
            {item.children && item.children.length > 0 ? (
              <>
                <div
                  className={`menu-items parent-menu ${expandedMenus[item.path] ? "expanded" : ""}`}
                  onClick={() => toggleMenu(item.path)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="icon">{item.icon}</div>
                  <div
                    className="name"
                    style={{ display: openSidebar ? "flex" : "none", justifyContent: "space-between", alignItems: "center", width: "100%" }}
                  >
                    <span>{item.name}</span>
                    <span className={`dropdown-icon ${expandedMenus[item.path] ? "expanded" : ""}`}>
                      <FaChevronRight />
                    </span>
                  </div>
                </div>
                <div className={`sub-menu-container ${expandedMenus[item.path] && openSidebar ? "expanded" : ""}`}>
                  <div className="sub-menu-list">
                    {item.children.map((child) => (
                      <NavLink
                        to={child.path}
                        end
                        key={child.path}
                        className={({ isActive }) =>
                          isActive ? "menu-items sub-menu-items active" : "menu-items sub-menu-items"
                        }
                      >
                        <div className="icon" style={{ fontSize: "16px", paddingRight: "17px" }}>{child.icon}</div>
                        <div className="name" style={{ display: openSidebar ? "" : "none" }}>
                          {child.name}
                        </div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <NavLink
                to={item.path}
                end
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
