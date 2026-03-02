import { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"; // Hooks lấy ID và điều hướng
import { AuthContext } from "../../../store/AuthContext";
import { AuthService } from "../../../services/AuthService";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini"; // Dùng lại spinner của bạn
import "./EmployeeDetail.scss"; // File style bên dưới
import { toast } from "react-toastify";

const EmployeeDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();
  const location = useLocation();
  const toastShownRef = useRef(false);
  const { user } = useContext(AuthContext);
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]); // State cho lịch sử công tác
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- PROPOSAL MODAL STATE ---
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [positions, setPositions] = useState([]);
  const [proposalForm, setProposalForm] = useState({
    changeType: "Salary_Increase",
    newSalary: "",
    newPositionName: "",
    effectiveDate: "",
    reason: "",
  });

  // Check message từ trang trước chuyển sang (nếu có)
  useEffect(() => {
    if (location.state?.successMessage && !toastShownRef.current) {
      toast.success(location.state.successMessage);
      toastShownRef.current = true;
      // Xóa state để tránh hiện lại khi refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      // Gọi song song 2 API: chi tiết nhân viên + lịch sử công tác
      const [detailRes, historyRes] = await Promise.all([
        AuthService.getEmployeeDetail(id),
        AuthService.getEmployeeCareerHistoryById(id).catch(() => ({ data: [] })) // Nếu lỗi thì trả [] thay vì fail cả trang
      ]);

      if (detailRes && detailRes.data) {
        setEmployee(detailRes.data);
      }
      if (historyRes && historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch (err) {
      // Xử lý các mã lỗi từ API
      if (err.response) {
        if (err.response.status === 403) {
          setError("⛔ Bạn không có quyền xem thông tin nhân viên này (Chỉ dành cho Admin hoặc Quản lý trực tiếp).");
        } else if (err.response.status === 404) {
          setError("❌ Không tìm thấy nhân viên này trong hệ thống.");
        } else {
          setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
        }
      } else {
        setError("Lỗi kết nối mạng.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm format
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "---";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "N/A";

  const getRoleName = (role) => role.replace('ROLE_', '');

  const changeTypeLabel = (type) => {
    const map = {
      Salary_Increase: "Tăng lương",
      Promotion: "Thăng chức",
      Promotion_With_Salary: "Thăng chức + Lương",
      Hired: "Tuyển dụng",
      Resigned: "Nghỉ việc",
      Rehired: "Làm lại",
      other: "Khác",
    };
    return map[type] || type;
  };

  // Helper function để hiển thị Badge trạng thái
  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase() || 'pending';
    const statusLabel = status === 'Approved' ? 'Đã duyệt' : status === 'Pending' ? 'Chờ duyệt' : status === 'Rejected' ? 'Từ chối' : status;
    return <span className={`status-badge ${statusClass}`}>{statusLabel}</span>;
  };

  // Nút quay lại
  const handleBack = () => navigate("/admin/employees");

  // --- PROPOSAL MODAL ---
  const openProposalModal = async () => {
    setProposalForm({
      changeType: "Salary_Increase",
      newSalary: "",
      newPositionName: "",
      effectiveDate: new Date().toISOString().split("T")[0],
      reason: "",
    });
    setShowProposalModal(true);

    // Fetch positions
    try {
      const res = await AuthService.getPositions();
      if (res && res.data) {
        setPositions(res.data);
      }
    } catch (e) {
      console.error("Lỗi tải danh sách chức vụ:", e);
    }
  };

  const handleProposalChange = (e) => {
    const { name, value } = e.target;

    if (name === "newSalary") {
      const rawValue = value.replace(/\D/g, "");
      const formattedValue = rawValue ? Number(rawValue).toLocaleString("vi-VN") : "";
      setProposalForm(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setProposalForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const needsSalary = ["Salary_Increase", "Promotion_With_Salary", "Rehired"].includes(proposalForm.changeType);
  const needsPosition = ["Promotion", "Promotion_With_Salary"].includes(proposalForm.changeType);
  const isOther = proposalForm.changeType === "other";
  const isRehired = proposalForm.changeType === "Rehired";

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setProposalSubmitting(true);
    try {
      const data = {
        employeeId: parseInt(id),
        changeType: proposalForm.changeType,
        effectiveDate: proposalForm.effectiveDate,
        reason: proposalForm.reason,
      };

      if (needsSalary || isOther || isRehired) {
        if (proposalForm.newSalary) {
          data.newSalary = Number(String(proposalForm.newSalary).replace(/\./g, ''));
        }
      }
      if (needsPosition || isOther || isRehired) {
        if (proposalForm.newPositionName) {
          data.newPositionName = proposalForm.newPositionName;
        }
      }

      await AuthService.createCareerChange(data);
      toast.success(isAdmin ? "Đã tạo và duyệt đề xuất thành công!" : "Đã gửi đề xuất, chờ Admin duyệt.");
      setShowProposalModal(false);
      // Refresh data
      setLoading(true);
      fetchData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message;
      if (err.response?.status === 400) {
        toast.error(msg || "Dữ liệu không hợp lệ.");
      } else if (err.response?.status === 403) {
        toast.error(msg || "Bạn không có quyền thực hiện thao tác này.");
      } else if (err.response?.status === 404) {
        toast.error(msg || "Không tìm thấy nhân viên hoặc chức vụ.");
      } else if (err.response?.status === 409) {
        toast.error(msg || "Nhân viên không ở trạng thái phù hợp.");
      } else {
        toast.error("Lỗi tạo đề xuất.");
      }
    } finally {
      setProposalSubmitting(false);
    }
  };

  if (loading) return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải thông tin nhân viên..." /></div>;

  // Giao diện Lỗi (403/404)
  if (error) {
    return (
      <div className="employee-detail-container error-state">
        <div className="error-card">
          <div className="icon">⚠️</div>
          <h3>Quyền truy cập bị từ chối hoặc dữ liệu không tồn tại</h3>
          <p>{error}</p>
          <button onClick={handleBack} className="btn-back">Quay lại danh sách</button>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="employee-detail-container">
      {/* Header: Nút Back & Tiêu đề */}
      <div className="detail-header">
        <button onClick={handleBack} className="btn-back-link">
          ← Quay lại danh sách
        </button>
        <h2>Hồ sơ nhân viên: #{employee.id}</h2>
      </div>

      <div className="detail-card">
        {/* Phần 1: Tổng quan (Avatar + Tên + Status) */}
        <div className="card-left">
          <div className="avatar-wrapper">
            <img
              src={employee.imageUrl || "https://res.cloudinary.com/dfcb3zzw9/image/upload/v1771060297/84760454-9909-44cf-ac6a-78c964a34ab4.png"}
              alt="Avatar"
              onError={(e) => { e.target.src = "https://res.cloudinary.com/dfcb3zzw9/image/upload/v1771060297/84760454-9909-44cf-ac6a-78c964a34ab4.png" }}
            />
          </div>
          <h2 className="fullname">{employee.lastName} {employee.firstName}</h2>
          <p className="position">{employee.positionName}</p>

          <div className={`status-tag ${employee.status.toLowerCase()}`}>
            {employee.status}
          </div>

          <div className="roles-list">
            {employee.roles.map(role => (
              <span key={role} className="role-badge">{getRoleName(role)}</span>
            ))}
          </div>
        </div>

        {/* Phần 2: Thông tin chi tiết */}
        <div className="card-right">
          <h3 className="section-title">Thông tin chi tiết</h3>

          <div className="info-grid">
            <div className="info-group">
              <label>Email</label>
              <p>{employee.email}</p>
            </div>
            <div className="info-group">
              <label>Số điện thoại</label>
              <p>{employee.phone}</p>
            </div>
            <div className="info-group">
              <label>Ngày vào làm</label>
              <p>{formatDate(employee.hireDate)}</p>
            </div>
            <div className="info-group">
              <label>Mức lương hiện tại</label>
              <p className="salary">{formatCurrency(employee.currentSalary)}</p>
            </div>
            {employee.proposedByName && (
              <div className="info-group">
                <label>Người đề xuất</label>
                <p>
                  <span
                    className="user-ref pointer"
                    onClick={() => navigate(`/admin/employees/${employee.proposedById}`)}
                  >
                    {employee.proposedByName} (ID: {employee.proposedById})
                  </span>
                </p>
              </div>
            )}
            {employee.approvedByName && (
              <div className="info-group">
                <label>Người duyệt</label>
                <p>
                  <span
                    className="user-ref pointer"
                    onClick={() => navigate(`/admin/employees/${employee.approvedById}`)}
                  >
                    {employee.approvedByName} (ID: {employee.approvedById})
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="action-footer">
            {employee.status !== "Rejected" && (
              <button className="btn-edit" onClick={() => navigate(`/admin/employees/${id}/edit`)}>
                ✏️ Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- CARD 2: LỊCH SỬ CÔNG TÁC & LƯƠNG --- */}
      <div className="history-card">
        <div className="card-header-simple">
          <h3>📜 Lịch sử thay đổi lương & Chức vụ</h3>
          {employee.status === "Active" && (
            <button className="btn-create-proposal" onClick={openProposalModal}>
              + Tạo đề xuất
            </button>
          )}
        </div>
        <div className="history-list">
          {history.length > 0 ? (
            history.map((item) => (
              <div className="history-item" key={item.id}>
                <div className="history-item-header">
                  <div className="header-left">
                    <span className={`change-type ${item.changeType?.toLowerCase()}`}>{changeTypeLabel(item.changeType)}</span>
                    <span className="effective-date">{formatDate(item.effectiveDate)}</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="history-item-body">
                  <div className="info-row">
                    <span className="label">Chức vụ:</span>
                    <div className="change-flow">
                      <span>{item.oldPositionName || "---"}</span>
                      <span className="arrow">➝</span>
                      <span className="new-val">{item.newPositionName || "---"}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="label">Mức lương:</span>
                    <div className="change-flow">
                      <span className="old-salary">{formatCurrency(item.oldSalary)}</span>
                      <span className="arrow">➝</span>
                      <span className="new-salary">{formatCurrency(item.newSalary)}</span>
                    </div>
                  </div>
                  {item.reason && (
                    <div className="info-row">
                      <span className="label">Lý do:</span>
                      <span className="value">{item.reason}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">Người đề xuất:</span>
                    {item.proposedByName ? (
                      <span
                        className="user-ref pointer"
                        onClick={() => navigate(`/admin/employees/${item.proposedById}`)}
                      >
                        {item.proposedByName} (ID: {item.proposedById})
                      </span>
                    ) : <span className="value">---</span>}
                  </div>
                  <div className="info-row">
                    <span className="label">Người duyệt:</span>
                    {item.approvedByName ? (
                      <span
                        className="user-ref pointer"
                        onClick={() => navigate(`/admin/employees/${item.approvedById}`)}
                      >
                        {item.approvedByName} (ID: {item.approvedById})
                      </span>
                    ) : <span className="value">---</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">Chưa có lịch sử thay đổi nào.</div>
          )}
        </div>
      </div>

      {/* ===== MODAL TẠO ĐỀ XUẤT ===== */}
      {showProposalModal && (
        <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
          <div className="proposal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>📝 Tạo đề xuất biến động</h3>
              <button className="modal-close" onClick={() => setShowProposalModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitProposal}>
              <div className="modal-body-custom">
                <div className="form-info">
                  <span>Nhân viên: <strong>{employee.lastName} {employee.firstName}</strong> (ID: {employee.id})</span>
                  <span>Lương hiện tại: <strong>{formatCurrency(employee.currentSalary)}</strong></span>
                  <span>Chức vụ hiện tại: <strong>{employee.positionName}</strong></span>
                </div>

                <div className="form-group">
                  <label>Loại biến động <span className="required">*</span></label>
                  <select name="changeType" value={proposalForm.changeType} onChange={handleProposalChange} required>
                    <option value="Salary_Increase">Tăng lương</option>
                    <option value="Promotion">Thăng chức</option>
                    <option value="Promotion_With_Salary">Thăng chức + Tăng lương</option>
                    {employee.status === "Active" && <option value="Resigned">Nghỉ việc</option>}
                    {employee.status === "Resigned" && <option value="Rehired">Làm lại</option>}
                    <option value="other">Khác</option>
                  </select>
                </div>

                {(needsSalary || isOther || isRehired) && (
                  <div className="form-group">
                    <label>Mức lương mới {needsSalary && <span className="required">*</span>}</label>
                    <input
                      type="text"
                      name="newSalary"
                      value={proposalForm.newSalary}
                      onChange={handleProposalChange}
                      placeholder="VD: 20.000.000"
                      required={needsSalary}
                    />
                  </div>
                )}

                {(needsPosition || isOther || isRehired) && (
                  <div className="form-group">
                    <label>Chức vụ mới {needsPosition && <span className="required">*</span>}</label>
                    <select
                      name="newPositionName"
                      value={proposalForm.newPositionName}
                      onChange={handleProposalChange}
                      required={needsPosition}
                    >
                      <option value="">-- Chọn chức vụ --</option>
                      {positions
                        .filter(p => p.positionName !== employee.positionName)
                        .map(p => (
                          <option key={p.id} value={p.positionName}>{p.positionName}</option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Ngày hiệu lực <span className="required">*</span></label>
                  <input
                    type="date"
                    name="effectiveDate"
                    value={proposalForm.effectiveDate}
                    onChange={handleProposalChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Lý do <span className="required">*</span></label>
                  <textarea
                    name="reason"
                    value={proposalForm.reason}
                    onChange={handleProposalChange}
                    placeholder="Nhập lý do đề xuất..."
                    required
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer-custom">
                <button type="button" className="btn-cancel" onClick={() => setShowProposalModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={proposalSubmitting}>
                  {proposalSubmitting ? "Đang gửi..." : isAdmin ? "Tạo & Duyệt tự động" : "Gửi đề xuất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;