import { useContext, useEffect, useState } from "react";
import AdminHeader from "../../components/Header/AdminHeader";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import { Navigate, Outlet } from "react-router-dom";
import "./AdminLayout.scss";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

import { AuthContext } from "../../store/AuthContext";
const AdminLayout = () => {
  // hien thi sidebar tren desktop
  const [openSidebar, setOpenSidebar] = useState(true);
  // hien thi sidebar tren mobile
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  // hien thi sidebar tren tablet
  const [showSidebarTablet, setShowSidebarTablet] = useState(false);
  const toggleSidebar = () => {
    if (window.innerWidth >= 280 && window.innerWidth < 576) {
      setShowSidebarMobile(!showSidebarMobile);
    } else if (window.innerWidth >= 768 && window.innerWidth < 992) {
      setShowSidebarTablet(!showSidebarTablet);
    } else if (window.innerWidth >= 992) {
      setOpenSidebar(!openSidebar);
    }
  };
  const { checkValidToken, loading } = useContext(AuthContext);

  useEffect(() => {
    const handleResize = () => {
      setOpenSidebar(true);
      // setShowSidebar(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen-center">
        <LoadingSpinner fullScreen={true} text="Đang tải dữ liệu hệ thống..." />
      </div>
    );
  }

  if (!checkValidToken()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <div className="admin-container">
        <AdminSidebar
          openSidebar={openSidebar}
          showSidebarMobile={showSidebarMobile}
          showSidebarTablet={showSidebarTablet}
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
