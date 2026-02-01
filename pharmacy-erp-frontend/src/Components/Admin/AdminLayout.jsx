import { useContext, useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { Navigate, Outlet } from "react-router-dom";
import "../scss/AdminLayout.scss";
import { AuthContext } from "../../store/AuthContext";

const AdminLayout = () => {
  const [openSidebar, setOpenSidabar] = useState(true);
  const toggleSidebar = () => {
    setOpenSidabar(!openSidebar);
  };
  const { checkValidToken } = useContext(AuthContext);
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
