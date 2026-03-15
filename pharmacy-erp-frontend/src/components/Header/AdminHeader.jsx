import "./AdminHeader.scss";
import { useState } from "react"; // 1. Import useState
import {
  FaBars,
  FaUser,
  FaSignOutAlt,
  FaKey,
  FaCalendarAlt,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { AuthContext } from "../../store/AuthContext";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "../ChangePasswordModal/ChangePasswordModal";

export default function AdminHeader({ toggleSidebar }) {
  const navigate = useNavigate(); // Bước 1: Khai báo
  const [isOpen, setIsOpen] = useState(false); // 2. State quản lý đóng/mở
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { logout, user } = useContext(AuthContext);
  const avatarUrl =
    user?.imgUrl ||
    "https://res.cloudinary.com/dfcb3zzw9/image/upload/v1771060297/84760454-9909-44cf-ac6a-78c964a34ab4.png"; // Ảnh đại diện mặc định nếu user chưa có avatars
  // Hàm toggle: Đang mở thì đóng, đang đóng thì mở
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    setIsPasswordModalOpen(true);
  };

  const handleProfile = () => {
    navigate("");
  };

  const handleLogout = () => {
    logout();
  };
  return (
    <div className="header-container">
      {/* Bên trái: Icon Menu */}
      <div className="header-left" style={{ color: "white" }}>
        <FaBars className="icon-fabars" onClick={toggleSidebar} />
      </div>

      {/* Bên phải: Avatar */}
      <div className="header-right">
        <div className="information-user" onClick={toggleDropdown}>
          <img src={avatarUrl} alt="User Avatar" className="user-avatar" />
          <span className="user-name">
            Xin chào, {user?.fullName || "Admin"}
            <span className="waving-hand">👋</span>
          </span>
        </div>
        {isOpen && (
          <>
            {/* Lớp màng trong suốt full màn hình để bắt sự kiện click ra ngoài */}
            <div
              className="overlay"
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
              }}
            ></div>
            <div className="dropdown-menu">
              <div className="menu-item" onClick={handleProfile}>
                <FaUser className="menu-icon" /> Thông tin cá nhân
              </div>
              <div
                className="menu-item"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin/my-salary");
                }}
              >
                <FaMoneyCheckAlt className="menu-icon" /> Tra cứu lương
              </div>
              <div
                className="menu-item"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin/my-leave-requests");
                }}
              >
                <FaCalendarAlt className="menu-icon" /> Nghỉ phép
              </div>
              <div className="menu-item" onClick={handleChangePassword}>
                <FaKey className="menu-icon" /> Đổi mật khẩu
              </div>
              <div className="menu-item logout" onClick={handleLogout}>
                <FaSignOutAlt className="menu-icon" /> Đăng xuất
              </div>
            </div>
          </>
        )}
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
