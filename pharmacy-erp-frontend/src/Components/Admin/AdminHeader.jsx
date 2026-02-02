import "../scss/AdminHeader.scss";
import { useState } from "react"; // 1. Import useState
import { FaBars,FaUser, FaSignOutAlt } from "react-icons/fa";

export default function AdminHeader({ toggleSidebar }) {
const [isOpen, setIsOpen] = useState(false); // 2. State quản lý đóng/mở
  const avatarUrl = "https://i.pravatar.cc/150?img=3";

  // Hàm toggle: Đang mở thì đóng, đang đóng thì mở
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }; 
  return (
    <div className="header-container">
      {/* Bên trái: Icon Menu */}
      <div className="header-left" style={{color:'white'}}>
        <FaBars className="icon-fabars" onClick={toggleSidebar} />
      </div>

      {/* Bên phải: Avatar */}
      <div className="header-right">
        <div className="information-user" onClick={toggleDropdown}>
        <img src={avatarUrl} alt="User Avatar"  className="user-avatar" />
        <span className="user-name">
            Xin chào, Ngô Công Thành 
            <span className="waving-hand">👋</span> 
          </span>
          </div>
           {isOpen && (
          <>
            {/* Lớp màng trong suốt full màn hình để bắt sự kiện click ra ngoài */}
              <div 
                className="overlay" 
                onClick={() => setIsOpen(false)}
                style={{position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex: 99}} 
              ></div>
              <div className="dropdown-menu">
                <div className="menu-item">
                  <FaUser className="menu-icon" /> Thông tin cá nhân
                </div>
                <div className="menu-item logout">
                  <FaSignOutAlt className="menu-icon" /> Đăng xuất
                </div>
              </div>
          </>
        )}
     
      </div>
    </div>
  );
}
