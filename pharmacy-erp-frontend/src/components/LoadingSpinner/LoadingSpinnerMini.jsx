// src/components/LoadingSpinner/LoadingSpinner.jsx
import "./LoadingSpinnerMini.scss";

// Bạn có thể truyền props "fullScreen" nếu muốn nó che phủ toàn bộ màn hình
// Hoặc để mặc định dùng cho các khu vực nhỏ hơn.
const LoadingSpinnerMini = ({ fullScreen = true, text = "Đang tải dữ liệu hệ thống..." }) => {
  // Sử dụng đường dẫn tuyệt đối từ thư mục public
  const logoUrl = "/logo.png";

  return (
    <div className={`pharmacy-loader-container-mini ${fullScreen ? 'full-screen' : ''}`}>
      <div className="loader-wrapper">
        {/* Vòng tròn quay bên ngoài */}
        <div className="spinner-ring-mini"></div>
        
        {/* Logo tĩnh nằm chính giữa */}
        <div className="logo-container-mini">
          <img src={logoUrl} alt="Pharmacy System Logo" className="loading-logo" />
        </div>
      </div>
      
      {/* Dòng chữ thông báo bên dưới (tùy chọn) */}
      {text && <p className="loading-text-mini">{text}</p>}
    </div>
  );
};

export default LoadingSpinnerMini;