import { useRef, useEffect, useState } from "react";
import "./UserProfile.scss";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import { AuthService } from "../../../services/AuthService";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]); // State cho lịch sử
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toastShownRef = useRef(false);

  // Hiển thị Toast thành công nếu có message từ trang Edit chuyển về
  useEffect(() => {
    if (location.state?.successMessage && !toastShownRef.current) {
      toast.success(location.state.successMessage);
      toastShownRef.current = true;
      // Xóa state để tránh hiện lại khi refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi song song 2 API để tiết kiệm thời gian
        const [profileRes, historyRes] = await Promise.all([
          AuthService.getProfile(),
          AuthService.getCareerHistory()
        ]);

        if (profileRes && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (historyRes && historyRes.data) {
          setHistory(historyRes.data);
        }

      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");

        if (err.response && err.response.status === 401) {
          setTimeout(() => {
            AuthService.logout();
            navigate("/login");
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "---";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const changeTypeLabel = (type) => {
    const map = {
      Salary_Increase: "Tăng lương",
      Promotion: "Thăng chức",
      Promotion_With_Salary: "Thăng chức + Lương",
      Resigned: "Nghỉ việc",
      Rehired: "Làm lại",
      Hired: "Tuyển dụng",
      other: "Khác",
    };
    return map[type] || type;
  };

  // Helper function để hiển thị Badge trạng thái
  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase() || 'pending';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải hồ sơ..." /></div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
        <h3>{error}</h3>
      </div>
    );
  }

  if (!profile) return <div>Không tìm thấy dữ liệu.</div>;

  return (
    <div className="profile-page-container">
      {/* --- CARD 1: THÔNG TIN CÁ NHÂN (Giữ nguyên) --- */}
      <div className="profile-card">
        <div className="card-header-cover">
          <div className="avatar-wrapper">
            <img
              src={profile.imageUrl || "https://via.placeholder.com/150"}
              alt={profile.fullName}
              className="profile-avatar"
              onError={(e) => { e.target.src = "https://via.placeholder.com/150" }}
            />
          </div>
        </div>

        <div className="card-body">
          <div className="identity-section">
            <h1 className="user-name">{profile.fullName}</h1>
            <span className="user-position">{profile.positionName}</span>
          </div>

          <div className="divider"></div>

          <div className="info-grid">
            <div className="info-column">
              <h3 className="column-title">Thông tin liên hệ</h3>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{profile.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Số điện thoại:</span>
                <span className="value">{profile.phone}</span>
              </div>
            </div>

            <div className="info-column">
              <h3 className="column-title">Thông tin công việc</h3>
              <div className="info-item">
                <span className="label">Ngày vào làm:</span>
                <span className="value">{formatDate(profile.hireDate)}</span>
              </div>
              <div className="info-item">
                <span className="label">Mức lương hiện tại:</span>
                <span className="value highlight-text">
                  {formatCurrency(profile.currentSalary)}
                </span>
              </div>
            </div>

          </div>
          <div className="action-buttons">
            <button className="btn-edit" onClick={() => navigate("/admin/profile/edit")}>Chỉnh sửa thông tin</button>
          </div>
        </div>
      </div>

      {/* --- CARD 2: LỊCH SỬ CÔNG TÁC & LƯƠNG (MỚI) --- */}
      <div className="profile-card history-card">
        <div className="card-header-simple">
          <h3>📜 Lịch sử thay đổi lương & Chức vụ</h3>
        </div>
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Ngày hiệu lực</th>
                <th>Loại thay đổi</th>
                <th>Chức vụ (Cũ → Mới)</th>
                <th>Mức lương (Cũ → Mới)</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.effectiveDate)}</td>
                    <td>
                      <span className={`change-type-badge ${item.changeType?.toLowerCase()}`}>
                        {changeTypeLabel(item.changeType)}
                      </span>
                    </td>
                    <td>
                      <div className="change-flow">
                        <span>{item.oldPositionName}</span>
                        <span className="arrow">➝</span>
                        <span className="new-val">{item.newPositionName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="change-flow">
                        <span className="old-salary">{formatCurrency(item.oldSalary)}</span>
                        <span className="arrow">➝</span>
                        <span className="new-salary">{formatCurrency(item.newSalary)}</span>
                      </div>
                    </td>
                    <td>{item.reason}</td>
                    <td>{getStatusBadge(item.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">Chưa có lịch sử thay đổi nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;