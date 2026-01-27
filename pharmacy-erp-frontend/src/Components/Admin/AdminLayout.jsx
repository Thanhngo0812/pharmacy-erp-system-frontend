import { useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { Outlet } from "react-router-dom";
import "../scss/AdminLayout.scss";

const AdminLayout = () => {
  const [openSidebar, setOpenSidabar] = useState(true);
  const toggleSidebar = () => {
    setOpenSidabar(!openSidebar);
  };
  return (
    <>
      <div className="admin-container">
        <AdminSidebar openSidebar={openSidebar} />
        <div className="header-content-container">
          <AdminHeader toggleSidebar={toggleSidebar} />
          <main className="content-container">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
