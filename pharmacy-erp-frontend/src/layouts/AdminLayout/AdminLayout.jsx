import { useContext, useState } from "react";
import AdminHeader from "../../components/Header/AdminHeader";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import { Navigate, Outlet } from "react-router-dom";
import "./AdminLayout.scss";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

import { AuthContext } from "../../store/AuthContext";
const AdminLayout = () => {
  const [openSidebar, setOpenSidabar] = useState(true);
  const toggleSidebar = () => {
    setOpenSidabar(!openSidebar);
  };
  const { checkValidToken, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="loading-screen-center">
        <LoadingSpinner fullScreen={true} text="Đang tải dữ liệu hệ thống..." />
      </div>
    );
  }
  if (!checkValidToken()) {
    return <Navigate to="/login" replace/>;
  }
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
