
import { useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../../store/AuthContext";
import { AuthService } from "../../services/AuthService";
import LoadingSpinnerMini from "../LoadingSpinner/LoadingSpinnerMini";
import "./ChangePasswordModal.scss";

export default function ChangePasswordModal({ isOpen, onClose }) {
    const { user } = useContext(AuthContext);

    // States
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [errors, setErrors] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    const validatePasswords = (pass, confirm) => {
        let newErrors = { newPassword: "", confirmPassword: "" };

        if (pass && pass.length < 8) {
            newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
        }

        if (confirm && confirm !== pass) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        setErrors(newErrors);
        return !newErrors.newPassword && !newErrors.confirmPassword;
    };

    useEffect(() => {
        if (newPassword || confirmPassword) {
            validatePasswords(newPassword, confirmPassword);
        } else {
            setErrors({ newPassword: "", confirmPassword: "" });
        }
    }, [newPassword, confirmPassword]);

    // Countdown logic
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Initialize email if user is logged in
    useEffect(() => {
        if (isOpen) {
            if (user?.email) {
                setEmail(user.email);
            }
            // Reset state when opening
            setStep(1);
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setTimer(0);
            setErrors({ newPassword: "", confirmPassword: "" });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.warning("Vui lòng nhập địa chỉ email!");
            return;
        }

        try {
            setLoading(true);
            await AuthService.forgotPassword(email);
            toast.success("Mã OTP đã được gửi đến email của bạn.");
            setTimer(30);
            setStep(2);
        } catch (error) {
            const msg = error.response?.data?.message || "Không thể gửi yêu cầu quên mật khẩu. Vui lòng thử lại.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!otp.trim()) {
            toast.warning("Vui lòng nhập mã OTP!");
            return;
        }
        if (newPassword.length < 8) {
            toast.warning("Mật khẩu mới phải có ít nhất 8 ký tự!");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.warning("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            setLoading(true);
            await AuthService.resetPassword(email, otp, newPassword);
            toast.success("Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.");
            onClose(); // Xong thì đóng modal
        } catch (error) {
            let msg = error.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn.";

            // Translate common errors
            if (msg.toLowerCase().includes("invalid otp")) {
                msg = "Mã OTP không chính xác. Vui lòng kiểm tra lại.";
            } else if (msg.toLowerCase().includes("expired")) {
                msg = "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.";
            }

            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-modal-overlay">
            <div className="change-password-modal-content">
                <div className="modal-header">
                    <h3>Đổi Mật Khẩu (OTP)</h3>
                    <button className="close-btn" onClick={onClose} disabled={loading}>&times;</button>
                </div>

                <div className="modal-body">
                    {step === 1 ? (
                        <form onSubmit={handleSendOTP}>
                            <p className="instruction-text">
                                Để bảo mật, hệ thống sẽ gửi một mã OTP gồm 6 chữ số tới Email của bạn:
                                {user?.email && <strong style={{ display: 'block', marginTop: '10px', fontSize: '1.1rem', color: '#1c7ed6' }}>{user.email}</strong>}
                            </p>

                            {!user?.email && (
                                <div className="form-group">
                                    <label>Email xác thực:</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Nhập địa chỉ email của bạn"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-confirm" disabled={loading || (!user?.email && !email) || timer > 0}>
                                    {loading ? <LoadingSpinnerMini /> : timer > 0 ? `Thử lại sau ${timer} s` : "Gửi mã OTP"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <p className="instruction-text">
                                Vui lòng kiểm tra email <b>{email}</b> để nhận mã OTP 6 số.
                            </p>
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Mã OTP:
                                    {timer > 0 ? (
                                        <span style={{ color: '#868e96', fontSize: '0.85rem' }}>Gửi lại sau {timer}s</span>
                                    ) : (
                                        <span
                                            style={{ color: '#1c7ed6', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
                                            onClick={handleSendOTP}
                                        >
                                            Gửi lại mã
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Nhập 6 số mã OTP"
                                    maxLength={6}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu mới:</label>
                                <input
                                    type="password"
                                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                                    required
                                    disabled={loading}
                                />
                                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu:</label>
                                <input
                                    type="password"
                                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    required
                                    disabled={loading}
                                />
                                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setStep(1)} disabled={loading}>
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    className="btn-confirm success"
                                    disabled={loading || !otp || !newPassword || !confirmPassword || errors.newPassword || errors.confirmPassword}
                                >
                                    {loading ? <LoadingSpinnerMini /> : "Đổi mật khẩu"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
