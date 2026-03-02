import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../../services/AuthService";
import { AuthContext } from "../../../store/AuthContext";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import { toast } from "react-toastify";
import "./ProfileEdit.scss";

const ProfileEdit = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useContext(AuthContext); // Lấy user từ context (để check role nếu cần, hoặc logout nếu token hết hạn)

    const fileInputRef = useRef(null);

    // State quản lý lỗi và loading
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    });

    // Hình ảnh
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    // 1. Tải thông tin hiện tại của User (API: getProfile hoặc lấy từ Context đều được, nhưng getProfile mới nhất)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await AuthService.getProfile();
                if (response && response.data) {
                    const profile = response.data;

                    let fName = profile.firstName || "";
                    let lName = profile.lastName || "";

                    // Nếu API trả về fullName gộp chung, ta cần tách ra
                    if (!fName && !lName && profile.fullName) {
                        const parts = profile.fullName.trim().split(" ");
                        if (parts.length > 1) {
                            fName = parts.pop(); // Lấy từ cuối cùng làm Tên
                            lName = parts.join(" "); // Phần còn lại làm Họ đệm
                        } else {
                            fName = parts[0] || "";
                            lName = "";
                        }
                    }

                    setFormData({
                        firstName: fName,
                        lastName: lName,
                        email: profile.email || "",
                        phone: profile.phone || "",
                    });
                    setImagePreview(profile.imageUrl || "https://res.cloudinary.com/dfcb3zzw9/image/upload/v1771060297/84760454-9909-44cf-ac6a-78c964a34ab4.png");
                }
            } catch (err) {
                console.error(err);
                setError("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
                if (err.response?.status === 401) {
                    // Token hết hạn thì đá về login sau 2s
                    setTimeout(() => navigate("/login"), 2000);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    // Xử lý thay đổi input text
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear lỗi nếu user nhập lại
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    // Xử lý chọn ảnh
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG).");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Dung lượng ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Validate Form
    const validate = () => {
        const newErrors = {};
        if (!formData.lastName.trim()) newErrors.lastName = "Vui lòng nhập họ và đệm.";
        if (!formData.firstName.trim()) newErrors.firstName = "Vui lòng nhập tên.";

        // Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Vui lòng nhập email.";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Email không hợp lệ.";
        }

        // Validate Phone (VN)
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Vui lòng nhập số điện thoại.";
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "Số điện thoại không hợp lệ (10 số).";
        }

        return newErrors;
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Vui lòng kiểm tra lại thông tin input.");
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = new FormData();

            // Ảnh (nếu có)
            if (imageFile) {
                submitData.append("image", imageFile);
            }

            // JSON Payload cho các trường text
            // API yêu cầu gửi json string trong field "data"
            const jsonPayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone
            };

            submitData.append(
                "data",
                new Blob([JSON.stringify(jsonPayload)], { type: "application/json" })
            );

            // Gọi API updateMyProfile
            await AuthService.updateMyProfile(submitData);

            // Cập nhật lại thông tin user trong Context và LocalStorage để Header phản hồi
            try {
                const updatedProfileData = await AuthService.getProfile();
                const updatedProfile = updatedProfileData?.data || updatedProfileData;
                if (updateUser && updatedProfile) {
                    updateUser({
                        imgUrl: updatedProfile.imageUrl,
                        fullName: updatedProfile.fullName || `${updatedProfile.lastName || ""} ${updatedProfile.firstName || ""}`.trim(),
                    });
                }
            } catch (profileErr) {
                console.error("Lỗi khi fetch lại profile để cập nhật header:", profileErr);
            }

            // Chuyển hướng về trang UserProfile kèm message thành công
            navigate("/admin", {
                state: { successMessage: "Cập nhật hồ sơ thành công!" }
            });

        } catch (err) {
            if (err.response?.status === 409) {
                toast.error(err.response.data?.message || "Email hoặc SĐT đã được sử dụng.");
            } else if (err.response?.status === 400) {
                toast.error("Dữ liệu không hợp lệ.");
            } else {
                toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải thông tin..." /></div>;

    if (error) {
        return (
            <div className="profile-edit-container error-state">
                <div className="error-card">
                    <h3>⚠️ {error}</h3>
                    <button onClick={() => navigate("/admin")} className="btn-cancel">Quay lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-edit-container">
            <div className="edit-header">
                <button onClick={() => navigate("/admin")} className="btn-back">
                    ← Quay lại hồ sơ
                </button>
                <h2>Chỉnh sửa thông tin cá nhân</h2>
            </div>

            <form className="edit-card" onSubmit={handleSubmit}>
                {/* CỘT TRÁI: ẢNH ĐẠI DIỆN */}
                <div className="card-left">
                    <div className="image-section">
                        <div className="avatar-wrapper">
                            <img
                                src={imagePreview}
                                alt="Avatar Preview"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/150" }}
                            />
                        </div>
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
                        {/* Helper Text như trang EmployeeEdit */}
                        <small className="help-text">
                            * Hệ thống sẽ xử lý đồng bộ ảnh lên đám mây sau khi bạn lưu, quá trình này có thể mất vài giây.
                        </small>
                    </div>
                </div>

                {/* CỘT PHẢI: FORM NHẬP LIỆU */}
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
                                placeholder="Nguyễn Văn"
                            />
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
                                placeholder="A"
                            />
                            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label>Email (Tên đăng nhập)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={errors.email ? "input-error" : ""}
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                            <small style={{ color: '#868e96', fontSize: '11px', marginTop: '4px' }}>
                                * Lưu ý: Thay đổi email cũng sẽ thay đổi tên đăng nhập của bạn.
                            </small>
                        </div>

                        <div className="form-group full-width">
                            <label>Số điện thoại</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={errors.phone ? "input-error" : ""}
                            />
                            {errors.phone && <span className="error-text">{errors.phone}</span>}
                        </div>
                    </div>

                    <div className="action-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate("/admin")}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang lưu..." : "💾 Cập nhật"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProfileEdit;
