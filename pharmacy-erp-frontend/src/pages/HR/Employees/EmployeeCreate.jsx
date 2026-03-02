import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../../services/AuthService";
import { toast } from "react-toastify";
import "./EmployeeCreate.scss";

const initialForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    positionName: "",
    currentSalary: "",
    hireDate: new Date().toISOString().split("T")[0],
    roles: [],
};

const EmployeeCreate = () => {
    const [formData, setFormData] = useState(initialForm);
    const [positions, setPositions] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Parse user info to determine current role
    const userStr = localStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : null;
    const isAdmin = userObj?.roles?.includes("ROLE_ADMIN");
    const isHM = userObj?.roles?.includes("ROLE_HM");

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Load positions on mount
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await AuthService.getPositions();
                if (response && response.data) {
                    setPositions(response.data);
                    // Set default position if available
                    if (response.data.length > 0) {
                        setFormData((prev) => ({ ...prev, positionName: response.data[0].positionName }));
                    }
                }
            } catch (error) {
                toast.error("Không thể tải danh sách chức vụ.");
            }
        };
        fetchPositions();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "currentSalary") {
            const rawValue = value.replace(/\D/g, "");
            const formattedValue = rawValue ? Number(rawValue).toLocaleString("vi-VN") : "";
            setFormData((prev) => ({ ...prev, [name]: formattedValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        // Clear field-specific error when changing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleRoleChange = (e) => {
        const { value, checked } = e.target;
        let newRoles = [...formData.roles];

        if (checked) {
            newRoles.push(value);

            // Xử lý loại trừ lẫn nhau (Mutual Exclusivity) giống trang Edit
            if (value === "ROLE_ADMIN") {
                newRoles = newRoles.filter(role => role !== "ROLE_HM");
            } else if (value === "ROLE_HM") {
                newRoles = newRoles.filter(role => role !== "ROLE_ADMIN");
            } else if (value === "ROLE_WM") {
                newRoles = newRoles.filter(role => role !== "ROLE_WS");
            } else if (value === "ROLE_WS") {
                newRoles = newRoles.filter(role => role !== "ROLE_WM");
            }
        } else {
            newRoles = newRoles.filter((role) => role !== value);
        }

        setFormData((prev) => ({ ...prev, roles: newRoles }));

        // Reset role validation error
        if (errors.roles) {
            setErrors((prev) => ({ ...prev, roles: null }));
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "Vui lòng nhập tên.";
        if (!formData.lastName.trim()) newErrors.lastName = "Vui lòng nhập họ đệm.";

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Vui lòng nhập email.";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Email không hợp lệ.";
        }

        // Phone Validation (Basic Vietnam format)
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
        if (!formData.phone.trim()) {
            newErrors.phone = "Vui lòng nhập số điện thoại.";
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "Số điện thoại không hợp lệ.";
        }

        if (!formData.positionName) newErrors.positionName = "Vui lòng chọn chức vụ.";
        const salaryValue = Number(String(formData.currentSalary || "").replace(/\./g, ''));
        if (!formData.currentSalary || salaryValue <= 0) newErrors.currentSalary = "Lương cơ bản phải lớn hơn 0.";
        if (!formData.hireDate) newErrors.hireDate = "Vui lòng chọn ngày vào làm.";

        if (formData.roles.length > 0) {
            // Role Exclusivity Logic
            const hasAdmin = formData.roles.includes("ROLE_ADMIN");
            const hasHM = formData.roles.includes("ROLE_HM");
            if (hasAdmin && hasHM) {
                newErrors.roles = "Một nhân viên không thể vừa làm Admin vừa làm HR Manager.";
            }
            const hasWM = formData.roles.includes("ROLE_WM");
            const hasWS = formData.roles.includes("ROLE_WS");
            if (hasWM && hasWS) {
                newErrors.roles = "Một nhân viên không thể vừa làm Warehouse Manager vừa làm Warehouse Staff.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            const dataToSubmit = new FormData();

            // Chuyển object data thành JSON Blob
            const salaryValue = Number(String(formData.currentSalary || "").replace(/\./g, ''));
            const employeeData = { ...formData, currentSalary: salaryValue };
            dataToSubmit.append(
                "data",
                new Blob([JSON.stringify(employeeData)], { type: "application/json" })
            );

            // Thêm image if  exists
            if (imageFile) {
                dataToSubmit.append("image", imageFile);
            }

            const response = await AuthService.createEmployee(dataToSubmit);
            if (response && response.success) {
                toast.success("Thêm nhân viên mới thành công!");
                navigate("/admin/employees");
            } else {
                toast.error(response?.message || "Lỗi tạo nhân viên, vui lòng thử lại.");
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Lỗi tạo nhân viên, vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/admin/employees");
    };

    return (
        <div className="employee-create-container">
            <div className="page-header">
                <h2 className="page-title">Thêm nhân viên mới</h2>
            </div>

            <div className="form-card">
                <form onSubmit={handleSubmit} className="employee-form" noValidate>
                    {/* Avatar Section */}
                    <div className="avatar-section">
                        <div className="avatar-preview" onClick={handleImageClick}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <span>Tải ảnh lên</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                        <p className="avatar-hint">Nhấn vào để thay đổi ảnh đại diện (Tùy chọn)</p>
                    </div>

                    <hr className="divider" />

                    {/* User Information */}
                    <div className="form-section-title">Thông tin cá nhân</div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Tên <span className="required">*</span></label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={errors.firstName ? "input-error" : ""}
                                placeholder="VD: Ngọc"
                            />
                            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Họ đệm <span className="required">*</span></label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className={errors.lastName ? "input-error" : ""}
                                placeholder="VD: Nguyễn"
                            />
                            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Email <span className="required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={errors.email ? "input-error" : ""}
                                placeholder="VD: ngochm@example.com"
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại <span className="required">*</span></label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={errors.phone ? "input-error" : ""}
                                placeholder="VD: 0987123456"
                            />
                            {errors.phone && <span className="error-text">{errors.phone}</span>}
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* Job Details */}
                    <div className="form-section-title">Thông tin công việc</div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Chức vụ <span className="required">*</span></label>
                            <select
                                name="positionName"
                                value={formData.positionName}
                                onChange={handleInputChange}
                                className={errors.positionName ? "input-error" : ""}
                            >
                                {positions.map((pos) => (
                                    <option key={pos.id} value={pos.positionName}>
                                        {pos.positionName}
                                    </option>
                                ))}
                            </select>
                            {errors.positionName && <span className="error-text">{errors.positionName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Lương cơ bản (VNĐ) <span className="required">*</span></label>
                            <input
                                type="text"
                                name="currentSalary"
                                value={formData.currentSalary}
                                onChange={handleInputChange}
                                className={errors.currentSalary ? "input-error" : ""}
                                placeholder="VD: 20.000.000"
                            />
                            {errors.currentSalary && <span className="error-text">{errors.currentSalary}</span>}
                        </div>

                        <div className="form-group">
                            <label>Ngày vào làm <span className="required">*</span></label>
                            <input
                                type="date"
                                name="hireDate"
                                value={formData.hireDate}
                                onChange={handleInputChange}
                                className={errors.hireDate ? "input-error" : ""}
                            />
                            {errors.hireDate && <span className="error-text">{errors.hireDate}</span>}
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* Roles Selection */}
                    <div className="form-section-title">Vai trò hệ thống</div>
                    <div className="roles-container">
                        {/* Chỉ hiện nhóm Quản trị & Nhân sự nếu là ADMIN */}
                        {isAdmin && (
                            <div className="role-group">
                                <span className="group-title">Quản trị & Nhân sự</span>
                                <label className="role-checkbox">
                                    <input
                                        type="checkbox"
                                        value="ROLE_ADMIN"
                                        checked={formData.roles.includes("ROLE_ADMIN")}
                                        onChange={handleRoleChange}
                                    />
                                    <span>Administrator (Admin)</span>
                                </label>
                                <label className="role-checkbox">
                                    <input
                                        type="checkbox"
                                        value="ROLE_HM"
                                        checked={formData.roles.includes("ROLE_HM")}
                                        onChange={handleRoleChange}
                                    />
                                    <span>HR Manager (Quản lý nhân sự)</span>
                                </label>
                            </div>
                        )}

                        <div className="role-group">
                            <span className="group-title">Kho hàng</span>
                            {/* Chỉ ADMIN mới được chọn ROLE_WM */}
                            {isAdmin && (
                                <label className="role-checkbox">
                                    <input
                                        type="checkbox"
                                        value="ROLE_WM"
                                        checked={formData.roles.includes("ROLE_WM")}
                                        onChange={handleRoleChange}
                                    />
                                    <span>Warehouse Manager (Quản lý kho)</span>
                                </label>
                            )}
                            {/* ADMIN và HM đều chọn được ROLE_WS */}
                            <label className="role-checkbox">
                                <input
                                    type="checkbox"
                                    value="ROLE_WS"
                                    checked={formData.roles.includes("ROLE_WS")}
                                    onChange={handleRoleChange}
                                />
                                <span>Warehouse Staff (Nhân viên kho)</span>
                            </label>
                        </div>

                        <div className="role-group">
                            <span className="group-title">Bán hàng</span>
                            {/* Cả ADMIN và HM đều tạo được Nhân viên bán hàng */}
                            <label className="role-checkbox">
                                <input
                                    type="checkbox"
                                    value="ROLE_SS"
                                    checked={formData.roles.includes("ROLE_SS")}
                                    onChange={handleRoleChange}
                                />
                                <span>Sales Staff (Dược sĩ bán hàng)</span>
                            </label>
                        </div>
                    </div>
                    {errors.roles && <div className="error-text role-error">{errors.roles}</div>}

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={handleCancel} disabled={loading}>
                            Hủy bỏ
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? "Đang xử lý..." : "Lưu nhân viên"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeCreate;
