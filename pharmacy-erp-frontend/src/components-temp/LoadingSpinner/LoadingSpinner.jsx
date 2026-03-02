// src/components/LoadingSpinner/LoadingSpinner.jsx
import "./LoadingSpinner.scss";

// Bạn có thể truyền props "fullScreen" nếu muốn nó che phủ toàn bộ màn hình
// Hoặc để mặc định dùng cho các khu vực nhỏ hơn.
const LoadingSpinner = ({ fullScreen = true, text = "Đang tải dữ liệu hệ thống..." }) => {
  // Sử dụng đường dẫn tuyệt đối từ thư mục public
  const logoUrl = "/logo.png";

  return (
    <div className={`pharmacy-loader-container ${fullScreen ? 'full-screen' : ''}`}>
      <div className="loader-wrapper">
        {/* Vòng tròn quay bên ngoài */}
        <div className="spinner-ring"></div>
        
        {/* Logo tĩnh nằm chính giữa */}
        <div className="logo-container">
          <img src={logoUrl} alt="Pharmacy System Logo" className="loading-logo" />
        </div>
      </div>
      
      {/* Dòng chữ thông báo bên dưới (tùy chọn) */}
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;