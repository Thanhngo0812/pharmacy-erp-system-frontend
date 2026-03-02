import { useEffect, useState, useRef, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AuthService } from "../../../services/AuthService";
import { AuthContext } from "../../../store/AuthContext";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import { toast } from "react-toastify";
import "./EmployeeEdit.scss";

// Danh sách các Roles trong hệ thống ERP của bạn
const AVAILABLE_ROLES = [
  { id: "ROLE_ADMIN", label: "Admin" },
  { id: "ROLE_WM", label: "Quản lý kho" },
  { id: "ROLE_HM", label: "Quản lý nhân sự" },
  { id: "ROLE_WS", label: "Nhân viên kho" },
  { id: "ROLE_SS", label: "Nhân viên bán hàng" },
];

const EmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Lấy user hiện tại

  // --- LOGIC 1: LỌC ROLE HIỂN THỊ ---
  const visibleRoles = useMemo(() => {
    if (!user) return [];
    let currentUserRoles = user.roles || [];

    // Fallback: Nếu user.roles rỗng, thử decode từ accessToken
    if (currentUserRoles.length === 0 && user.accessToken) {
      try {
        const decoded = jwtDecode(user.accessToken);
        if (Array.isArray(decoded.roles)) {
          currentUserRoles = decoded.roles;
        } else if (typeof decoded.roles === "string") {
          currentUserRoles = [decoded.roles];
        }
      } catch (e) {
        console.error("Lỗi decode token:", e);
      }
    }

    // Admin thấy hết
    if (currentUserRoles.includes("ROLE_ADMIN")) {
      return AVAILABLE_ROLES;
    }

    // HM chỉ thấy WS và SS
    if (currentUserRoles.includes("ROLE_HM")) {
      return AVAILABLE_ROLES.filter(role => ["ROLE_WS", "ROLE_SS"].includes(role.id));
    }

    // Role khác -> Không thấy gì (hoặc rỗng)
    return [];
  }, [user]);

  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  // States
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roles: [],
  });

  // Xử lý Ảnh
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // 1. Tải dữ liệu cũ đổ vào Form
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await AuthService.getEmployeeDetail(id);
        if (response && response.data) {
          const emp = response.data;
          setFormData({
            firstName: emp.firstName || "",
            lastName: emp.lastName || "",
            email: emp.email || "",
            phone: emp.phone || "",
            roles: emp.roles || [],
          });
          setImagePreview(emp.imageUrl || "https://res.cloudinary.com/dfcb3zzw9/image/upload/v1771060297/84760454-9909-44cf-ac6a-78c964a34ab4.png");
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError("⛔ Bạn không có quyền sửa thông tin nhân viên này.");
        } else if (err.response?.status === 404) {
          setError("❌ Không tìm thấy nhân viên.");
        } else {
          setError("Lỗi tải thông tin nhân viên.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Xử lý thay đổi input text
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Nếu đang có báo lỗi ở field này mà user gõ lại thì xóa lỗi đi
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Xử lý thay đổi Checkbox Role
  const handleRoleChange = (roleId) => {
    setFormData((prev) => {
      const isSelected = prev.roles.includes(roleId);
      let newRoles = [];

      if (isSelected) {
        // Bỏ chọn
        newRoles = prev.roles.filter((r) => r !== roleId);
      } else {
        // Chọn thêm
        newRoles = [...prev.roles, roleId];

        // --- LOGIC 2: MUTUAL EXCLUSIVITY (WS và WM bài trừ lẫn nhau) ---
        if (roleId === "ROLE_WS") {
          // Chọn WS -> Hủy WM
          newRoles = newRoles.filter(r => r !== "ROLE_WM");
        } else if (roleId === "ROLE_WM") {
          // Chọn WM -> Hủy WS
          newRoles = newRoles.filter(r => r !== "ROLE_WS");
        }

        // --- LOGIC 3: MUTUAL EXCLUSIVITY (Admin và HM bài trừ lẫn nhau) ---
        if (roleId === "ROLE_ADMIN") {
          newRoles = newRoles.filter(r => r !== "ROLE_HM");
        } else if (roleId === "ROLE_HM") {
          newRoles = newRoles.filter(r => r !== "ROLE_ADMIN");
        }
      }
      return { ...prev, roles: newRoles };
    });
  };

  // Xử lý chọn ảnh mới
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate sơ bộ: chỉ nhận ảnh
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG).");
        return;
      }

      // Validate dung lượng: < 5MB (Spring Boot mặc định thường là 10MB, nhưng FE chặn sớm cho an toàn)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        toast.error("Dung lượng ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
        return;
      }

      setImageFile(file);
      // Tạo URL tạm thời để hiển thị preview
      setImagePreview(URL.createObjectURL(file));


    }
  };
  const validate = () => {
    const newErrors = {};

    // 1. Validate Tên (Không được để trống)
    if (!formData.lastName.trim()) newErrors.lastName = "Vui lòng nhập họ và đệm.";
    if (!formData.firstName.trim()) newErrors.firstName = "Vui lòng nhập tên.";

    // 2. Validate Email (Phải đúng định dạng)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không hợp lệ (VD: admin@pharmacy.com).";
    }

    // 3. Validate Số điện thoại (Chuẩn số VN: Bắt đầu bằng 03, 05, 07, 08, 09 và đủ 10 số)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải gồm 10 số và hợp lệ tại VN.";
    }

    return newErrors;
  };
  // 2. Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    // ---> GỌI HÀM VALIDATE TRƯỚC KHI LÀM NHỮNG VIỆC KHÁC <---
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại các thông tin chưa hợp lệ!");

      setErrors(validationErrors);
      return; // Dừng lại, không chạy API nữa
    }
    setIsSubmitting(true);

    try {

      // Tạo đối tượng FormData
      const submitData = new FormData();

      // Nạp file ảnh (chỉ gửi nếu người dùng có chọn ảnh mới)
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      // Nạp dữ liệu text dưới dạng chuỗi JSON
      const jsonPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        roles: formData.roles,
      };

      // TRICK CHO SPRING BOOT: Ép chuỗi JSON thành Blob application/json
      // Giúp @RequestPart("data") đọc được dễ dàng
      submitData.append(
        "data",
        new Blob([JSON.stringify(jsonPayload)], { type: "application/json" })
      );

      // Gọi API
      await AuthService.updateEmployee(id, submitData);

      // Chuyển trang kèm theo message thành công
      navigate(`/admin/employees/${id}`, {
        state: { successMessage: "Cập nhật thông tin thành công!" }
      });
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(err.response.data?.message || "thông tin đã tồn tại.");
      }
      else if (err.response?.status === 400) {
        toast.error("dữ liệu không hợp lệ.");
      } else if (err.response?.status === 403) {
        toast.error(err.response.data?.message || "Bạn không có quyền gán vai trò này.");
      } else {
        toast.error("Cập nhật thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải dữ liệu..." /></div>;

  if (error) {
    return (
      <div className="employee-edit-container error-state">
        <div className="error-card">
          <h3>{error}</h3>
          <button onClick={() => navigate("/admin/employees")} className="btn-cancel">Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-edit-container">
      <div className="edit-header">
        <button onClick={() => navigate(`/admin/employees/${id}`)} className="btn-back">
          ← Hủy & Quay lại
        </button>
        <h2>Chỉnh sửa hồ sơ nhân viên #{id}</h2>
      </div>

      <form className="edit-card" onSubmit={handleSubmit}>
        {/* --- CỘT TRÁI: Ảnh & Phân Quyền --- */}
        <div className="card-left">
          <div className="image-section">
            <div className="avatar-wrapper">
              <img src={imagePreview} alt="Preview" />
            </div>
            {/* Nút giả lập để click vào ô input file bị ẩn */}
            <button
              type="button"
              className="btn-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Đổi ảnh đại diện
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/webp"
              hidden
            />
            <small className="help-text">
              * Hệ thống sẽ xử lý đồng bộ ảnh lên đám mây sau khi bạn lưu, quá trình này có thể mất vài giây.
            </small>
          </div>


          {/* Chỉ hiển thị phần phân quyền nếu KHÔNG PHẢI là Admin cấp cao nhất (ID = 1) */}
          {String(id) !== "1" && visibleRoles.length > 0 && (
            <div className="roles-section">
              <h3 className="section-title">Phân quyền (Roles) - Tùy chọn</h3>

              {[
                { title: "Quản trị & Nhân sự", groupRoles: ["ROLE_ADMIN", "ROLE_HM"] },
                { title: "Kho vận", groupRoles: ["ROLE_WM", "ROLE_WS"] },
                { title: "Bán hàng", groupRoles: ["ROLE_SS"] }
              ].map((group, index) => {
                // Lọc ra những role trong group này mà user hiện tại được phép thấy
                const groupVisibleRoles = visibleRoles.filter(r => group.groupRoles.includes(r.id));

                // Nếu group này không có role nào được phép thấy -> Ẩn cả group
                if (groupVisibleRoles.length === 0) return null;

                return (
                  <div key={index} className="role-group" style={{ marginBottom: "12px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#495057", marginBottom: "8px" }}>{group.title}</h4>
                    <div className="roles-list">
                      {groupVisibleRoles.map((role) => (
                        <label key={role.id} className="role-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.roles.includes(role.id)}
                            onChange={() => handleRoleChange(role.id)}
                          />
                          <span>{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              <small className="help-text">
                * Quản lý (HM) chỉ có thể gán/hủy quyền WS và SS.
                <br />
                * Nhân viên kho (WS) và Quản lý kho (WM) không thể chọn cùng lúc.
                <br />
                * Admin và Quản lý nhân sự (HM) không thể chọn cùng lúc.
              </small>
            </div>
          )}
        </div>

        {/* --- CỘT PHẢI: Thông tin cá nhân --- */}
        <div className="card-right">
          <h3 className="section-title">Thông tin cơ bản</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Họ và đệm</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={errors.lastName ? "input-error" : ""}
                placeholder="VD: Nguyễn Văn"
              />
              {/* Hiện câu báo lỗi nếu có */}
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label>Tên</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={errors.firstName ? "input-error" : ""}
                placeholder="VD: An"
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>

            <div className="form-group full-width">
              <label>Email (Tài khoản đăng nhập)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "input-error" : ""}
                placeholder="email@pharmacy.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group full-width">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={errors.phone ? "input-error" : ""}
                placeholder="0901234567"
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>
          <div className="action-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(`/admin/employees/${id}`)}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "💾 Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEdit;