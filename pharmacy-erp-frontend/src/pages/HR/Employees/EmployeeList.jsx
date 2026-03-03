import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../../services/AuthService";
import { AuthContext } from "../../../store/AuthContext";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { toast } from "react-toastify";
import "./EmployeeList.scss";

const EmployeeList = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- STATE CHO DUYỆT NHÂN SỰ ---
  const [hiredRequests, setHiredRequests] = useState([]);
  const [hiredLoading, setHiredLoading] = useState(false);
  const [hiredFilters, setHiredFilters] = useState({
    sortBy: "id",
    order: "asc",
    status: "",
    employeeName: "",
    proposedById: "",
    id: ""
  });
  const [hiredCurrentPage, setHiredCurrentPage] = useState(1);
  const hiredItemsPerPage = 5;
  const [isEditingHiredPage, setIsEditingHiredPage] = useState(false);
  const [inputHiredPage, setInputHiredPage] = useState(1);
  const hiredInputRef = useRef(null);

  // --- 1. STATE BỘ LỌC ---
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    status: "",
    sortBy: "id",
    order: "asc",
  });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    employee: null,
    type: "danger",
    title: "",
    message: "",
    actionType: "",
    showInput: false
  });

  const [reason, setReason] = useState("");

  const openConfirmModal = (employee, action) => {
    let type = "danger";
    let title = "";
    let message = "";

    switch (action) {
      case "lock":
        type = "danger";
        title = "Khóa tài khoản";
        message = `Bạn có chắc chắn muốn KHÓA tài khoản của ${employee.lastName} ${employee.firstName}? Nhân viên này sẽ không thể đăng nhập được nữa.`;
        break;
      case "unlock":
        type = "success";
        title = "Mở khóa tài khoản";
        message = `Bạn có chắc chắn muốn MỞ KHÓA cho ${employee.lastName} ${employee.firstName}? Nhân viên sẽ có thể truy cập lại hệ thống.`;
        break;
      case "resign":
        type = "danger";
        title = "Xác nhận nghỉ việc";
        message = `Bạn có chắc chắn muốn cập nhật trạng thái "Nghỉ việc" cho ${employee.lastName} ${employee.firstName}?`;
        break;
      case "rehire":
        type = "success";
        title = "Xác nhận làm lại";
        message = `Bạn có chắc chắn muốn cập nhật trạng thái "Đang làm việc" cho ${employee.lastName} ${employee.firstName}?`;
        break;
      case "delete":
        type = "danger";
        title = "Xác nhận xóa nhân viên";
        message = `Bạn có chắc chắn muốn TỪ CHỐI và XÓA HOÀN TOÀN hồ sơ của nhân viên ${employee.lastName} ${employee.firstName}?`;
        break;
      default:
        break;
    }

    setReason("");
    setModalConfig({
      isOpen: true,
      employee,
      type,
      title,
      message,
      actionType: action,
      showInput: action === "resign" || action === "rehire"
    });
  };

  const openApproveConfirmModal = (request, isApproved) => {
    setModalConfig({
      isOpen: true,
      employee: request,
      type: isApproved ? "success" : "danger",
      title: isApproved ? "Xác nhận duyệt" : "Xác nhận từ chối",
      message: isApproved
        ? `Bạn có chắc chắn muốn duyệt hồ sơ cho ${request.employeeName}? Nhân viên sẽ được chuyển sang trạng thái Đang làm việc.`
        : `Bạn có chắc chắn muốn từ chối hồ sơ cho ${request.employeeName}?`,
      actionType: isApproved ? "approve_hired" : "reject_hired",
      showInput: false
    });
  };

  const handleConfirmAction = async () => {
    const { employee, actionType } = modalConfig;
    setModalConfig({ ...modalConfig, isOpen: false });

    if (actionType === "lock" || actionType === "unlock") {
      const isLocking = actionType === "lock";
      const oldEmployees = [...employees];
      setEmployees(employees.map(emp => emp.id === employee.id ? { ...emp, isActive: !isLocking } : emp));
      try {
        await AuthService.toggleLockAccount(employee.id, isLocking);
        toast.info(isLocking ? "Đã khóa tài khoản thành công!" : "Đã mở khóa tài khoản thành công!");
      } catch (err) {
        setEmployees(oldEmployees);
        toast.error("Lỗi: Không thể cập nhật trạng thái tài khoản.");
      }
    } else if (actionType === "resign" || actionType === "rehire") {
      try {
        const requestData = {
          date: new Date().toISOString().split('T')[0],
          reason: reason.trim() || "Cập nhật từ trang Quản lý nhân viên (Admin)"
        };
        if (actionType === "resign") {
          await AuthService.resignEmployee(employee.id, requestData);
          toast.success("Đã cập nhật trạng thái: Nghỉ việc");
        } else {
          await AuthService.rehireEmployee(employee.id, requestData);
          toast.success("Đã cập nhật trạng thái: Đang làm việc");
        }
        fetchEmployees();
      } catch (err) {
        toast.error("Lỗi: Không thể cập nhật trạng thái nhân viên.");
      }
    } else if (actionType === "delete") {
      try {
        await AuthService.deleteEmployee(employee.id);
        toast.success("Đã xóa nhân viên thành công.");
        fetchEmployees();
      } catch (err) {
        toast.error("Lỗi: Không thể xóa nhân viên.");
      }
    } else if (actionType === "approve_hired" || actionType === "reject_hired") {
      const isApproved = actionType === "approve_hired";
      try {
        await AuthService.approveHiredCareerChange(employee.id, isApproved);
        toast.success(`Đã ${isApproved ? "duyệt" : "từ chối"} hồ sơ thành công`);
        fetchHiredRequests();
        fetchEmployees();
      } catch (error) {
        toast.error("Không thể xử lý hồ sơ");
      }
    }
  };

  const handleCloseModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [inputPage, setInputPage] = useState(1);
  const inputRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const cleanParams = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
      const response = await AuthService.getEmployees(cleanParams);
      if (response && response.data) setEmployees(response.data);
    } catch (err) {
      setError("Không thể tải danh sách nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHiredRequests = async () => {
    if (!isAdmin) return;
    try {
      setHiredLoading(true);
      const params = { ...hiredFilters };
      Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
      const res = await AuthService.getHiredCareerChanges(params);
      setHiredRequests(res.data || res || []);
    } catch (error) {
      console.error(error);
    } finally {
      setHiredLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const delayDebounceFn = setTimeout(() => {
        fetchHiredRequests();
        setHiredCurrentPage(1);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [hiredFilters, isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const handlePageClick = () => {
    setIsEditingPage(true);
    setInputPage(currentPage);
    setTimeout(() => inputRef.current?.select(), 0);
  };
  const handlePageInputChange = (e) => setInputPage(e.target.value);
  const submitPage = () => {
    setIsEditingPage(false);
    let n = parseInt(inputPage);
    if (isNaN(n) || n < 1) n = 1; else if (n > totalPages) n = totalPages;
    setCurrentPage(n);
  };
  const handlePageKeyDown = (e) => { if (e.key === "Enter") submitPage(); };

  const hiredTotalPages = Math.ceil(hiredRequests.length / hiredItemsPerPage);
  const handleHiredPageClick = () => {
    setIsEditingHiredPage(true);
    setInputHiredPage(hiredCurrentPage);
    setTimeout(() => hiredInputRef.current?.select(), 0);
  };
  const submitHiredPage = () => {
    setIsEditingHiredPage(false);
    let n = parseInt(inputHiredPage);
    if (isNaN(n) || n < 1) n = 1; else if (n > hiredTotalPages) n = hiredTotalPages;
    setHiredCurrentPage(n);
  };
  const handleHiredPageKeyDown = (e) => { if (e.key === "Enter") submitHiredPage(); };

  const currentEmployees = employees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentHiredRequests = hiredRequests.slice((hiredCurrentPage - 1) * hiredItemsPerPage, hiredCurrentPage * hiredItemsPerPage);

  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "N/A";

  const getStatusBadgeHired = (status) => {
    switch (status) {
      case "Approved": return <span className="status-badge active" style={{ backgroundColor: 'rgba(64, 192, 87, 0.1)', color: '#40c057' }}>Đã duyệt</span>;
      case "Rejected": return <span className="status-badge rejected" style={{ backgroundColor: 'rgba(250, 82, 82, 0.1)', color: '#fa5252' }}>Từ chối</span>;
      default: return <span className="status-badge pending" style={{ backgroundColor: 'rgba(250, 176, 5, 0.1)', color: '#e67300' }}>Chờ duyệt</span>;
    }
  };

  const handleReset = () => setFilters({ name: "", phone: "", status: "", sortBy: "id", order: "asc" });
  const handleResetHired = () => setHiredFilters({ sortBy: "id", order: "asc", status: "", employeeName: "", proposedById: "", id: "" });


  return (
    <div className="employee-list-container">
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showInput={modalConfig.showInput}
        inputValue={reason}
        onInputChange={setReason}
        inputPlaceholder={modalConfig.actionType === "rehire" ? "Nhập lý do làm lại..." : "Nhập lý do nghỉ việc..."}
      />

      <div className="page-header">
        <h2 className="page-title">Quản lý nhân viên</h2>
        <button className="btn-add" onClick={() => navigate('/admin/employees/create')}>
          + Thêm mới
        </button>
      </div>

      {isAdmin && (
        <div className="tabs-container">
          <button className={`tab-item ${activeTab === "employees" ? "active" : ""}`} onClick={() => setActiveTab("employees")}>
            Nhân viên hiện có
          </button>
          <button className={`tab-item ${activeTab === "hired" ? "active" : ""}`} onClick={() => setActiveTab("hired")}>
            Hồ sơ tuyển dụng
            {hiredRequests.filter(r => r.status === "Pending").length > 0 && (
              <span className="tab-badge">{hiredRequests.filter(r => r.status === "Pending").length}</span>
            )}
          </button>
        </div>
      )}

      {activeTab === "employees" ? (
        <>
          <div className="filter-card">
            <div className="filter-form">
              <div className="filter-group">
                <input type="text" name="name" placeholder="Tìm theo tên..." value={filters.name} onChange={handleInputChange} />
              </div>
              <div className="filter-group">
                <input type="text" name="phone" placeholder="Tìm số điện thoại..." value={filters.phone} onChange={handleInputChange} />
              </div>
              <div className="filter-group">
                <select name="status" value={filters.status} onChange={handleInputChange}>
                  <option value="">-- Tất cả trạng thái --</option>
                  <option value="Active">Đang làm việc</option>
                  <option value="Resigned">Đã nghỉ</option>
                  <option value="Waiting">Chờ duyệt</option>
                  <option value="Rejected">Từ chối</option>
                </select>
              </div>
              <div className="filter-group sort-group">
                <select name="sortBy" value={filters.sortBy} onChange={handleInputChange}>
                  <option value="id">Sắp xếp: ID</option>
                  <option value="salary">Sắp xếp: Lương</option>
                  <option value="hireDate">Sắp xếp: Ngày vào</option>
                  <option value="lastName">Sắp xếp: Tên</option>
                </select>
                <select name="order" value={filters.order} onChange={handleInputChange} className="order-select">
                  <option value="asc">Tăng ⬆</option>
                  <option value="desc">Giảm ⬇</option>
                </select>
              </div>
              <div className="filter-actions">
                <button type="button" onClick={handleReset} className="btn-reset">Đặt lại</button>
              </div>
            </div>
          </div>

          {error ? <div className="error-message">{error}</div> : loading && employees.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <LoadingSpinnerMini fullScreen={false} text="Đang tải dữ liệu..." />
            </div>
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Chức vụ / Vai trò</th>
                      <th>Liên hệ</th>
                      <th>Lương cơ bản</th>
                      <th>Ngày vào làm</th>
                      <th>Trạng thái</th>
                      <th>Email</th>
                      <th>Khóa/Mở</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.length > 0 ? (
                      currentEmployees.map((emp) => (
                        <tr key={emp.id}>
                          <td>
                            <div className="user-info">
                              <img src={emp.imageUrl || "https://res.cloudinary.com/dfcb3zzw9/image/upload/v1771060297/84760454-9909-44cf-ac6a-78c964a34ab4.png"} alt="avt" className="avatar-small" />
                              <div className="user-details">
                                <span className="fullname">{emp.lastName} {emp.firstName}</span>
                                <span className="email-small">ID: {emp.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>{emp.positionName}</td>
                          <td>{emp.phone}</td>
                          <td className="salary-text">{formatCurrency(emp.currentSalary)}</td>
                          <td>{formatDate(emp.hireDate)}</td>
                          <td><span className={`status-badge ${emp.status?.toLowerCase()}`}>
                            {emp.status === 'Active' ? 'Đang làm' : emp.status === 'Resigned' ? 'Đã nghỉ' : emp.status === 'Waiting' ? 'Chờ duyệt' : 'Từ chối'}
                          </span></td>
                          <td><span className={`mail-badge ${emp.mailStatus?.toLowerCase() || 'notsent'}`}>{emp.mailStatus || 'Chưa gửi'}</span></td>
                          <td>
                            <label className="switch-toggle">
                              <input type="checkbox" checked={emp.isActive} disabled={emp.status === 'Resigned' || emp.status === 'Waiting' || emp.status === 'Rejected'} onChange={() => openConfirmModal(emp, emp.isActive ? "lock" : "unlock")} />
                              <span className="slider round"></span>
                            </label>
                          </td>
                          <td className="actions-cell">
                            <div className="action-buttons">
                              <button className="action-btn view" onClick={() => navigate(`/admin/employees/${emp.id}`)}>Xem</button>
                              <button className="action-btn edit" onClick={() => navigate(`/admin/employees/${emp.id}/edit`)}>Sửa</button>
                              {emp.status === 'Waiting' ? (
                                <button className="action-btn delete" onClick={() => openConfirmModal(emp, "delete")}>Xóa</button>
                              ) : emp.status === 'Resigned' ? (
                                <button className="action-btn rehire" onClick={() => openConfirmModal(emp, "rehire")}>Làm lại</button>
                              ) : (
                                <button className="action-btn resign" onClick={() => openConfirmModal(emp, "resign")}>Nghỉ</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" className="no-data">Không có nhân viên</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className="pagination">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>&lt;</button>
                  <div className="page-display">
                    {isEditingPage ? (
                      <input ref={inputRef} type="number" className="page-input" value={inputPage} onChange={handlePageInputChange} onBlur={submitPage} onKeyDown={handlePageKeyDown} min="1" max={totalPages} />
                    ) : (
                      <span className="page-text" onClick={handlePageClick}>Trang <b>{currentPage}</b> / {totalPages}</span>
                    )}
                  </div>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>&gt;</button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        isAdmin && (
          <div className="hired-tab-content">
            <div className="filter-card">
              <div className="filter-form">
                <div className="filter-group">
                  <input type="text" placeholder="Tên nhân viên..." value={hiredFilters.employeeName} onChange={(e) => setHiredFilters(prev => ({ ...prev, employeeName: e.target.value }))} />
                </div>
                <div className="filter-group">
                  <select value={hiredFilters.status} onChange={(e) => setHiredFilters(prev => ({ ...prev, status: e.target.value }))}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="Pending">Chờ duyệt</option>
                    <option value="Approved">Đã duyệt</option>
                    <option value="Rejected">Từ chối</option>
                  </select>
                </div>
                <div className="filter-actions">
                  <button type="button" className="btn-reset" onClick={handleResetHired}>Đặt lại</button>
                </div>
              </div>
            </div>

            {hiredLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <LoadingSpinnerMini fullScreen={false} text="Đang tải dữ liệu..." />
              </div>
            ) : (
              <div className="table-card">
                <div className="table-responsive">
                  <table className="employee-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nhân viên</th>
                        <th>Chức vụ đề xuất</th>
                        <th>Ngày đề xuất</th>
                        <th>Lương</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hiredRequests.length === 0 ? (
                        <tr>
                          <td colSpan="7">
                            <div className="no-data" style={{ padding: '60px 0', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', border: '1px dashed #dee2e6' }}>
                              <div className="empty-icon" style={{ fontSize: '48px', color: '#ced4da', marginBottom: '10px' }}>
                                <i className="bi bi-folder2-open"></i>
                              </div>
                              <p style={{ color: '#868e96', fontSize: '15px', margin: 0 }}>Không có hồ sơ nào</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentHiredRequests.map((req) => (
                          <tr key={req.id}>
                            <td>#{req.id}</td>
                            <td>{req.employeeName}</td>
                            <td>{req.positionName}</td>
                            <td>{formatDate(req.effectiveDate)}</td>
                            <td className="salary-text">{formatCurrency(req.newSalary)}</td>
                            <td>{getStatusBadgeHired(req.status)}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="action-btn view" onClick={() => navigate(`/admin/employees/${req.employeeId}`)}>Xem</button>
                                {req.status === 'Pending' && (
                                  <>
                                    <button className="action-btn edit" style={{ background: '#d4edda', color: '#155724' }} onClick={() => openApproveConfirmModal(req, true)}>Duyệt</button>
                                    <button className="action-btn delete" onClick={() => openApproveConfirmModal(req, false)}>Từ chối</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {hiredTotalPages > 0 && (
                  <div className="pagination">
                    <button disabled={hiredCurrentPage === 1} onClick={() => setHiredCurrentPage(prev => prev - 1)}>&lt;</button>
                    <div className="page-display">
                      {isEditingHiredPage ? (
                        <input ref={hiredInputRef} type="number" className="page-input" value={inputHiredPage} onChange={(e) => setInputHiredPage(e.target.value)} onBlur={submitHiredPage} onKeyDown={handleHiredPageKeyDown} />
                      ) : (
                        <span className="page-text" onClick={handleHiredPageClick}>Trang <b>{hiredCurrentPage}</b> / {hiredTotalPages}</span>
                      )}
                    </div>
                    <button disabled={hiredCurrentPage === hiredTotalPages} onClick={() => setHiredCurrentPage(prev => prev + 1)}>&gt;</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default EmployeeList;