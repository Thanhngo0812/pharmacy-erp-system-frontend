import { useContext, useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { Navigate, Outlet } from "react-router-dom";
import "../scss/AdminLayout.scss";
import { AuthContext } from "../../store/AuthContext";

const AdminLayout = () => {
  // hien thi sidebar tren desktop
  const [openSidebar, setOpenSidebar] = useState(true);
  // hien thi sidebar tren mobile
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      // mobile
      setShowSidebar(!showSidebar);
    } else {
      // desktop
      setOpenSidebar(!openSidebar);
    }
  };
  useEffect(() => {
    const handleResize = () => {
      setOpenSidebar(true);
      setShowSidebar(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const { checkValidToken } = useContext(AuthContext);
  if (!checkValidToken()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <div className="admin-container">
        <AdminSidebar
          openSidebar={openSidebar}
          showSidebar={showSidebar}
          toggleSidebar={toggleSidebar}
        />
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
