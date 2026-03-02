import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.scss";
// ---> 1. IMPORT COMPONENT LOADING SPINNER <---
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";

export default function Login() {
  const navigate = useNavigate();
  const { login, checkValidToken } = useContext(AuthContext);

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (checkValidToken()) {
      navigate("/admin", { replace: true });
    }
  }, [checkValidToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
    setLoginError("");
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.username) newErrors.username = "Vui lòng nhập email.";
    else if (!emailRegex.test(formData.username)) newErrors.username = "Email không hợp lệ.";
    if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu.";
    else if (formData.password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Bắt đầu loading toàn màn hình
    setIsSubmitting(true);

    // (Tuỳ chọn) Mở dòng này để ngắm spinner lâu hơn khi test
    await new Promise(r => setTimeout(r, 500));
    try {
      const result = await login(formData);

      if (result) {
        // Đăng nhập thành công
        navigate("/admin", { replace: true });
      } else {
        // Sai email/mật khẩu (Logic từ backend trả về false)
        setLoginError("Email hoặc mật khẩu không chính xác.");
      }
    } catch (error) {
      // RƠI VÀO ĐÂY KHI: Server sập, mất mạng, lỗi 500, etc. HOẶC Backend trả về lỗi 4xx

      console.error("Login Error:", error);

      if (!window.navigator.onLine) {
        setLoginError("Không có kết nối internet.");
      } else if (error.response) {
        if (error.response.status === 423) {
          setLoginError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        } else if (error.response.status === 401 || error.response.status === 403) {
          setLoginError("Email hoặc mật khẩu không chính xác.");
        } else if (error.response.status >= 500) {
          setLoginError("Hệ thống đang bảo trì hoặc server gặp sự cố. Vui lòng thử lại sau!");
        } else {
          setLoginError(error.response.data?.message || "Đã xảy ra lỗi. Vui lòng kiểm tra lại.");
        }
      } else {
        setLoginError("Đã xảy ra lỗi không xác định. Vui lòng kiểm tra lại.");
      }
    } finally {
      // Dù thành công hay thất bại (catch) thì cũng tắt loading
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* ---> 2. HIỂN THỊ LOADING TOÀN MÀN HÌNH KHI ĐANG SUBMIT <--- */}
      {isSubmitting && <LoadingSpinner fullScreen={true} text="Đang xác thực thông tin..." />}

      <div className="login-container">
        <div className="login-header">
          {/* Logo trắng sẽ nổi bật trên nền mới */}
          <div className="logo-wrapper">
            <img src="/logo.png" alt="Pharmacy Logo" className="login-logo" />
          </div>
          <h2 className="title">Hệ thống Pharmacy ERP</h2>
          <p className="subtitle">Đăng nhập để quản lý nhà thuốc</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {loginError && <div className="alert-error">{loginError}</div>}

          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="text" id="username" name="username"
              placeholder="Email"
              value={formData.username} onChange={handleChange}
              className={errors.username ? "input-error" : ""}
              disabled={isSubmitting} // Disable khi đang loading
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password" id="password" name="password"
              placeholder="Mật khẩu"
              value={formData.password} onChange={handleChange}
              className={errors.password ? "input-error" : ""}
              disabled={isSubmitting} // Disable khi đang loading
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {/* Nút bấm bình thường, không còn loader nhỏ */}
          <button type="submit" className="btn-login" disabled={isSubmitting}>
            Đăng nhập
          </button>
        </form>
        <div className="login-footer">
          <p>© 2026 Pharmacy System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}