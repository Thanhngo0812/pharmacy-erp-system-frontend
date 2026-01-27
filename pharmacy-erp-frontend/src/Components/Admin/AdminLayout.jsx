import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { Outlet } from "react-router-dom";
import "../scss/AdminLayout.scss";

const AdminLayout = () => {
  return (
    <>
      <div className="admin-container">
        <AdminSidebar />
        <div className="header-content-container">
          <AdminHeader />
          <main className="content-container">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
