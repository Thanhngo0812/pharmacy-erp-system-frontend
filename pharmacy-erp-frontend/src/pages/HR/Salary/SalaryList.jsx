import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../store/AuthContext";
import { AuthService } from "../../../services/AuthService";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { toast } from "react-toastify";
import "./SalaryList.scss";

const SalaryList = ({ embedded = false }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes("ROLE_ADMIN");

    const [employees, setEmployees] = useState([]);
    const [totalSalaryFund, setTotalSalaryFund] = useState(0);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. STATE BỘ LỌC ---
    const [filters, setFilters] = useState({
        id: "",
        name: "",
        status: "",
        minSalary: "",
        maxSalary: "",
        sortBy: "id",
        order: "asc",
    });

    // --- 2. STATE PHÂN TRANG & NHẬP TRANG ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isEditingPage, setIsEditingPage] = useState(false);
    const [inputPage, setInputPage] = useState(1);
    const inputRef = useRef(null);

    // ==========================================
    // ===  PHẦN PROPOSALS (ĐỀ XUẤT BIẾN ĐỘNG) ===
    // ==========================================
    const [proposals, setProposals] = useState([]);
    const [proposalLoading, setProposalLoading] = useState(true);
    const [proposalFilters, setProposalFilters] = useState({
        status: "",
        employeeId: "",
        changeType: "",
        sortBy: "id",
        order: "desc",
    });
    const [proposalPage, setProposalPage] = useState(1);
    const proposalPerPage = 8;

    // Phân trang proposal
    const [isEditingProposalPage, setIsEditingProposalPage] = useState(false);
    const [inputProposalPage, setInputProposalPage] = useState(1);
    const proposalInputRef = useRef(null);

    // Confirm Modal for approve/reject
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        proposal: null,
        type: "success",
        title: "",
        message: "",
        actionType: "", // "approve" | "reject"
    });
    const [actionReason, setActionReason] = useState("");
    const [textModal, setTextModal] = useState({ isOpen: false, title: "", content: "" });

    // --- HELPER ĐỊNH DẠNG & LỌC SỐ ---
    const stripNonDigits = (value) => {
        if (!value) return "";
        return value.toString().replace(/\D/g, "");
    };

    const formatInputNumber = (value) => {
        if (!value) return "";
        const number = stripNonDigits(value);
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // --- 3. USE EFFECT: REAL-TIME SEARCH (DEBOUNCE) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSalaryList();
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // --- FETCH PROPOSALS ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProposals();
            setProposalPage(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proposalFilters]);

    // --- HÀM GỌI API ---
    const fetchSalaryList = async () => {
        setLoading(true);
        setError(null);
        try {
            const cleanParams = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== "")
            );
            const response = await AuthService.getEmployeeSalary(cleanParams);
            if (response && response.data) {
                setEmployees(response.data.employees || []);
                setTotalSalaryFund(response.data.totalSalaryFund || 0);
                setTotalEmployees(response.data.totalEmployees || 0);
            }
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError("Bạn không có quyền xem danh sách lương.");
            } else {
                setError("Không thể tải danh sách lương.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchProposals = async () => {
        setProposalLoading(true);
        try {
            const cleanParams = Object.fromEntries(
                Object.entries(proposalFilters).filter(([_, v]) => v !== "")
            );
            let response;
            if (isAdmin) {
                response = await AuthService.getCareerChanges(cleanParams);
            } else {
                response = await AuthService.getMyCareerChanges(cleanParams);
            }
            if (response && response.data) {
                setProposals(response.data || []);
            }
        } catch (err) {
            console.error("Lỗi tải đề xuất:", err);
        } finally {
            setProposalLoading(false);
        }
    };

    // --- XỬ LÝ INPUT FILTER ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Nếu là trường id (Mã nhân viên), chỉ cho phép nhập số
        const cleanValue = name === "id" ? stripNonDigits(value) : value;
        setFilters((prev) => ({
            ...prev,
            [name]: cleanValue,
        }));
    };

    const handleProposalFilterChange = (e) => {
        const { name, value } = e.target;
        // Nếu là employeeId, lọc bỏ ký tự lạ
        const cleanValue = name === "employeeId" ? stripNonDigits(value) : value;
        setProposalFilters((prev) => ({ ...prev, [name]: cleanValue }));
    };

    // --- XỬ LÝ NHẬP SỐ TRANG (SALARY) ---
    const totalPages = Math.ceil(employees.length / itemsPerPage);

    const handlePageClick = () => {
        setIsEditingPage(true);
        setInputPage(currentPage);
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const handlePageInputChange = (e) => {
        setInputPage(e.target.value);
    };

    const submitPage = () => {
        setIsEditingPage(false);
        let pageNumber = parseInt(inputPage);
        if (isNaN(pageNumber) || pageNumber < 1) {
            pageNumber = 1;
        } else if (pageNumber > totalPages) {
            pageNumber = totalPages;
        }
        setCurrentPage(pageNumber);
    };

    const handlePageKeyDown = (e) => {
        if (e.key === "Enter") {
            submitPage();
        }
    };

    // --- XỬ LÝ NHẬP SỐ TRANG (PROPOSAL) ---
    const totalProposalPages = Math.ceil(proposals.length / proposalPerPage);

    const handleProposalPageClick = () => {
        setIsEditingProposalPage(true);
        setInputProposalPage(proposalPage);
        setTimeout(() => proposalInputRef.current?.select(), 0);
    };

    const submitProposalPage = () => {
        setIsEditingProposalPage(false);
        let pageNumber = parseInt(inputProposalPage);
        if (isNaN(pageNumber) || pageNumber < 1) pageNumber = 1;
        else if (pageNumber > totalProposalPages) pageNumber = totalProposalPages;
        setProposalPage(pageNumber);
    };

    // --- LOGIC CẮT TRANG ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);

    const proposalStart = (proposalPage - 1) * proposalPerPage;
    const currentProposals = proposals.slice(proposalStart, proposalStart + proposalPerPage);

    // --- HELPER ---
    const formatCurrency = (amount) =>
        amount != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount) : "---";
    const formatDate = (dateString) =>
        dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "N/A";

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

    const handleReset = () => {
        setFilters({ id: "", name: "", status: "", minSalary: "", maxSalary: "", sortBy: "id", order: "asc" });
    };

    // --- APPROVE / REJECT ---
    const openActionModal = (proposal, action) => {
        setActionReason("");
        setConfirmModal({
            isOpen: true,
            proposal,
            type: action === "approve" ? "success" : "danger",
            title: action === "approve" ? "Duyệt đề xuất" : "Từ chối đề xuất",
            message: action === "approve"
                ? `Xác nhận duyệt đề xuất #${proposal.id} cho nhân viên?`
                : `Xác nhận từ chối đề xuất #${proposal.id}?`,
            actionType: action,
        });
    };

    const handleConfirmAction = async () => {
        const { proposal, actionType } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
            await AuthService.approveRejectCareerChange(proposal.id, {
                isApproved: actionType === "approve",
                reason: actionReason.trim() || (actionType === "approve" ? "Đã duyệt" : "Từ chối"),
            });
            toast.success(actionType === "approve" ? "Đã duyệt đề xuất thành công!" : "Đã từ chối đề xuất.");
            fetchProposals();
            fetchSalaryList(); // Refresh lương nếu có thay đổi
        } catch (err) {
            console.error(err);
            if (err.response?.status === 409) {
                toast.error(err.response.data?.message || "Đề xuất đã được xử lý trước đó.");
            } else if (err.response?.status === 403) {
                toast.error("Bạn không có quyền thực hiện thao tác này.");
            } else {
                toast.error("Thao tác thất bại.");
            }
        }
    };

    // --- XỬ LÝ LƯƠNG ---

    const handleSalaryInputChange = (e) => {
        const { name, value } = e.target;
        const rawValue = stripNonDigits(value);
        setFilters((prev) => ({
            ...prev,
            [name]: rawValue,
        }));
    };

    if (loading && employees.length === 0) return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải dữ liệu..." /></div>;

    return (
        <div className={`salary-list-container ${embedded ? 'embedded' : ''}`}>
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                showInput={true}
                inputValue={actionReason}
                onInputChange={setActionReason}
                inputPlaceholder="Nhập lý do..."
            />

            {!embedded && (
                <div className="page-header">
                    <h2 className="page-title">Quản lý Lương</h2>
                </div>
            )}

            {/* --- SUMMARY CARDS --- */}
            <div className="summary-cards">
                <div className="summary-card fund">
                    <span className="summary-label">Tổng quỹ lương</span>
                    <span className="summary-value">{formatCurrency(totalSalaryFund)}</span>
                </div>
                <div className="summary-card count">
                    <span className="summary-label">Tổng nhân viên</span>
                    <span className="summary-value">{totalEmployees}</span>
                </div>
            </div>

            {/* --- BỘ LỌC --- */}
            <div className="filter-card">
                <div className="filter-form">
                    <div className="filter-group">
                        <label>Mã nhân viên</label>
                        <input type="text" name="id" placeholder="Tìm theo ID..." value={filters.id} onChange={handleInputChange} />
                    </div>
                    <div className="filter-group">
                        <label>Tên nhân viên</label>
                        <input type="text" name="name" placeholder="Tìm theo tên..." value={filters.name} onChange={handleInputChange} />
                    </div>
                    <div className="filter-group">
                        <label>Trạng thái</label>
                        <select name="status" value={filters.status} onChange={handleInputChange}>
                            <option value="">-- Tất cả trạng thái --</option>
                            <option value="Active">Đang làm việc</option>
                            <option value="Resigned">Đã nghỉ</option>
                            <option value="Waiting">Chờ duyệt</option>
                            <option value="Rejected">Từ chối</option>
                        </select>
                    </div>
                    <div className="filter-group salary-range-group">
                        <div className="range-input-wrapper">
                            <label>Lương tối thiểu</label>
                            <input
                                type="text"
                                name="minSalary"
                                placeholder="Từ..."
                                value={formatInputNumber(filters.minSalary)}
                                onChange={handleSalaryInputChange}
                            />
                        </div>
                        <span className="range-separator">-</span>
                        <div className="range-input-wrapper">
                            <label>Lương tối đa</label>
                            <input
                                type="text"
                                name="maxSalary"
                                placeholder="Đến..."
                                value={formatInputNumber(filters.maxSalary)}
                                onChange={handleSalaryInputChange}
                            />
                        </div>
                    </div>
                    <div className="filter-group sort-group">
                        <div className="sort-input-wrapper" style={{ flex: 2 }}>
                            <label>Sắp xếp theo</label>
                            <select name="sortBy" value={filters.sortBy} onChange={handleInputChange}>
                                <option value="id">ID</option>
                                <option value="salary">Lương</option>
                                <option value="hiredate">Ngày vào</option>
                            </select>
                        </div>
                        <div className="sort-input-wrapper" style={{ flex: 1 }}>
                            <label>Thứ tự</label>
                            <select name="order" value={filters.order} onChange={handleInputChange} className="order-select">
                                <option value="asc">Tăng ⬆</option>
                                <option value="desc">Giảm ⬇</option>
                            </select>
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button type="button" onClick={handleReset} className="btn-reset">Đặt lại</button>
                    </div>
                </div>
            </div>

            {error ? <div className="error-message">{error}</div> : (
                <div className="table-card">
                    {/* --- TABLE VIEW (Desktop) --- */}
                    <div className="table-responsive">
                        <table className="salary-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Họ tên</th>
                                    <th>Chức vụ</th>
                                    <th>Lương hiện tại</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày vào làm</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEmployees.length > 0 ? (
                                    currentEmployees.map((emp) => (
                                        <tr key={emp.employeeId} className="clickable-row" onClick={() => navigate(`/admin/employees/${emp.employeeId}`)}>
                                            <td>{emp.employeeId}</td>
                                            <td className="name-cell">{emp.fullName}</td>
                                            <td>{emp.positionName}</td>
                                            <td className="salary-text">{formatCurrency(emp.currentSalary)}</td>
                                            <td><span className={`status-badge ${emp.status?.toLowerCase()}`}>{
                                                emp.status === 'Active' ? 'Đang làm' :
                                                    emp.status === 'Resigned' ? 'Đã nghỉ' :
                                                        emp.status === 'Waiting' ? 'Chờ duyệt' :
                                                            emp.status === 'Rejected' ? 'Từ chối' : emp.status
                                            }</span></td>
                                            <td>{formatDate(emp.hireDate)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="no-data">Không tìm thấy nhân viên nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- MOBILE CARD VIEW --- */}
                    <div className="mobile-salary-list">
                        {currentEmployees.length > 0 ? (
                            currentEmployees.map((emp) => (
                                <div className="salary-card" key={emp.employeeId} onClick={() => navigate(`/admin/employees/${emp.employeeId}`)}>
                                    <div className="card-header">
                                        <div className="emp-info">
                                            <span className="fullname">{emp.fullName}</span>
                                            <span className="emp-id">ID: {emp.employeeId}</span>
                                        </div>
                                        <span className={`status-badge ${emp.status?.toLowerCase()}`}>{
                                            emp.status === 'Active' ? 'Đang làm' :
                                                emp.status === 'Resigned' ? 'Đã nghỉ' :
                                                    emp.status === 'Waiting' ? 'Chờ duyệt' :
                                                        emp.status === 'Rejected' ? 'Từ chối' : emp.status
                                        }</span>
                                    </div>
                                    <div className="card-body">
                                        <div className="info-row">
                                            <span className="label">Chức vụ:</span>
                                            <span className="value">{emp.positionName}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Lương:</span>
                                            <span className="value salary-text">{formatCurrency(emp.currentSalary)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Ngày vào:</span>
                                            <span className="value">{formatDate(emp.hireDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">Không tìm thấy nhân viên nào.</div>
                        )}
                    </div>

                    {/* --- PHÂN TRANG --- */}
                    {totalPages > 0 && (
                        <div className="pagination">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>&lt;</button>
                            <div className="page-display">
                                {isEditingPage ? (
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        className="page-input"
                                        value={inputPage}
                                        onChange={handlePageInputChange}
                                        onBlur={submitPage}
                                        onKeyDown={handlePageKeyDown}
                                        min="1"
                                        max={totalPages}
                                    />
                                ) : (
                                    <span
                                        className="page-text"
                                        onClick={handlePageClick}
                                        title="Nhấn để nhập số trang"
                                    >
                                        Trang <b>{currentPage}</b> / {totalPages}
                                    </span>
                                )}
                            </div>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>&gt;</button>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* ===  SECTION 2: DANH SÁCH ĐỀ XUẤT BIẾN ĐỘNG LƯƠNG/CHỨC VỤ === */}
            {/* ============================================================ */}
            <div className="proposal-section">
                <div className="section-header">
                    <h3>{isAdmin ? "📋 Đề xuất biến động nhân sự" : "📋 Đề xuất của tôi"}</h3>
                </div>

                {/* Bộ lọc proposal */}
                <div className="filter-card proposal-filter">
                    <div className="filter-form">
                        <div className="filter-group">
                            <label>Mã nhân viên</label>
                            <input
                                type="number"
                                name="employeeId"
                                placeholder="Tìm theo ID..."
                                value={proposalFilters.employeeId}
                                min="1"
                                onChange={handleProposalFilterChange}
                            />
                        </div>
                        <div className="filter-group">
                            <label>Trạng thái</label>
                            <select name="status" value={proposalFilters.status} onChange={handleProposalFilterChange}>
                                <option value="">-- Tất cả trạng thái --</option>
                                <option value="Pending">Chờ duyệt</option>
                                <option value="Approved">Đã duyệt</option>
                                <option value="Rejected">Từ chối</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Loại biến động</label>
                            <select name="changeType" value={proposalFilters.changeType} onChange={handleProposalFilterChange}>
                                <option value="">-- Tất cả loại --</option>
                                <option value="Salary_Increase">Tăng lương</option>
                                <option value="Promotion">Thăng chức</option>
                                <option value="Promotion_With_Salary">Thăng chức + Lương</option>
                                <option value="Resigned">Nghỉ việc</option>
                                <option value="Rehired">Làm lại</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <div className="filter-group sort-group">
                            <div className="sort-input-wrapper" style={{ flex: 2 }}>
                                <label>Sắp xếp theo</label>
                                <select name="sortBy" value={proposalFilters.sortBy} onChange={handleProposalFilterChange}>
                                    <option value="id">ID</option>
                                    <option value="effectiveDate">Ngày hiệu lực</option>
                                    <option value="newSalary">Lương mới</option>
                                </select>
                            </div>
                            <div className="sort-input-wrapper" style={{ flex: 1 }}>
                                <label>Thứ tự</label>
                                <select name="order" value={proposalFilters.order} onChange={handleProposalFilterChange} className="order-select">
                                    <option value="desc">Mới nhất ⬇</option>
                                    <option value="asc">Cũ nhất ⬆</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bảng đề xuất */}
                {proposalLoading ? (
                    <div style={{ padding: '30px', textAlign: 'center' }}>
                        <LoadingSpinnerMini fullScreen={false} text="Đang tải đề xuất..." />
                    </div>
                ) : (
                    <div className="proposal-table-card">
                        <div className="proposal-table-responsive">
                            <table className="proposal-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "6%" }}>ID</th>
                                        <th style={{ width: "20%" }}>Nhân viên & Loại</th>
                                        <th style={{ width: "24%" }}>Nội dung biến động</th>
                                        <th style={{ width: "16%" }}>Lý do</th>
                                        {isAdmin && <th style={{ width: "12%" }}>Người đề xuất</th>}
                                        <th style={{ width: "12%" }}>Trạng thái</th>
                                        {isAdmin && <th style={{ width: "10%" }}>Thao tác</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProposals.length > 0 ? (
                                        currentProposals.map((p) => (
                                            <tr key={p.id}>
                                                <td className="id-col">#{p.id}</td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                        <span
                                                            className="user-ref pointer"
                                                            style={{ fontWeight: "700", color: "#4dabf7" }}
                                                            onClick={() => navigate(`/admin/employees/${p.employeeId}`)}
                                                            title={`ID Nhân viên: ${p.employeeId}`}
                                                        >
                                                            {p.employeeName ? `${p.employeeName} (id: ${p.employeeId})` : `EMP-${p.employeeId}`}
                                                        </span>
                                                        <div><span className={`change-type-badge ${p.changeType?.toLowerCase()}`}>{changeTypeLabel(p.changeType)}</span></div>
                                                        <span style={{ fontSize: "12px", color: "#868e96", fontWeight: "600" }}>Hiệu lực: {formatDate(p.effectiveDate)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                        <div className="change-flow-inline">
                                                            <span style={{ fontSize: "12px", color: "#868e96", minWidth: "54px", display: "inline-block" }}>Lương:</span>
                                                            <span className="old-val">{formatCurrency(p.oldSalary)}</span>
                                                            <span className="arrow">→</span>
                                                            <span className="new-val">{formatCurrency(p.newSalary)}</span>
                                                        </div>
                                                        <div className="change-flow-inline">
                                                            <span style={{ fontSize: "12px", color: "#868e96", minWidth: "54px", display: "inline-block" }}>Chức vụ:</span>
                                                            <span className="old-val" style={{ textDecoration: 'none' }}>{p.oldPositionName || "---"}</span>
                                                            <span className="arrow">→</span>
                                                            <span className="new-val">{p.newPositionName || "---"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="reason-col">
                                                    {p.reason && (
                                                        <div
                                                            className="reason-item proposal"
                                                            onClick={() => setTextModal({ isOpen: true, title: "Lý do đề xuất", content: p.reason })}
                                                            title="Nhấn để xem chi tiết"
                                                        >
                                                            <b>Đề xuất:</b> {p.reason}
                                                        </div>
                                                    )}
                                                    {p.approvalReason && (
                                                        <div
                                                            className={`reason-item ${p.status === 'Approved' ? 'approved' : 'rejected'}`}
                                                            onClick={() => setTextModal({ isOpen: true, title: p.status === 'Approved' ? "Lý do duyệt" : "Lý do từ chối", content: p.approvalReason })}
                                                            title="Nhấn để xem chi tiết"
                                                        >
                                                            <b>{p.status === 'Approved' ? 'Duyệt:' : 'Từ chối:'}</b> {p.approvalReason}
                                                        </div>
                                                    )}
                                                    {!p.reason && !p.approvalReason && "---"}
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        {p.proposedByName ? (
                                                            <span
                                                                className="user-ref pointer"
                                                                onClick={() => navigate(`/admin/employees/${p.proposedById}`)}
                                                            >
                                                                {`${p.proposedByName} (id: ${p.proposedById})`}
                                                            </span>
                                                        ) : "---"}
                                                    </td>
                                                )}
                                                <td>
                                                    <span className={`status-badge ${p.status?.toLowerCase()}`}>
                                                        {p.status === 'Approved' ? 'Đã duyệt' : p.status === 'Pending' ? 'Chờ duyệt' : 'Từ chối'}
                                                    </span>
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        {p.status === "Pending" ? (
                                                            <div className="action-buttons">
                                                                <button className="action-btn approve" onClick={() => openActionModal(p, "approve")}>Duyệt</button>
                                                                <button className="action-btn reject" onClick={() => openActionModal(p, "reject")}>Từ chối</button>
                                                            </div>
                                                        ) : (
                                                            <span className="action-done">—</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={isAdmin ? "7" : "6"} className="no-data">Không có đề xuất nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Phân trang proposal */}
                        {totalProposalPages > 0 && (
                            <div className="pagination">
                                <button disabled={proposalPage === 1} onClick={() => setProposalPage(prev => prev - 1)}>&lt;</button>
                                <div className="page-display">
                                    {isEditingProposalPage ? (
                                        <input
                                            ref={proposalInputRef}
                                            type="number"
                                            className="page-input"
                                            value={inputProposalPage}
                                            onChange={(e) => setInputProposalPage(e.target.value)}
                                            onBlur={submitProposalPage}
                                            onKeyDown={(e) => e.key === "Enter" && submitProposalPage()}
                                            min="1"
                                            max={totalProposalPages}
                                        />
                                    ) : (
                                        <span
                                            className="page-text"
                                            onClick={handleProposalPageClick}
                                            title="Nhấn để nhập số trang"
                                        >
                                            Trang <b>{proposalPage}</b> / {totalProposalPages}
                                        </span>
                                    )}
                                </div>
                                <button disabled={proposalPage === totalProposalPages} onClick={() => setProposalPage(prev => prev + 1)}>&gt;</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Text Modal cho việc xem lý do dài */}
            {textModal.isOpen && (
                <div className="modal-overlay" onClick={() => setTextModal({ ...textModal, isOpen: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header primary" style={{ backgroundColor: '#65A7E3' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>{textModal.title}</h3>
                        </div>
                        <div className="modal-body" style={{ padding: '20px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                            {textModal.content}
                        </div>
                        <div className="modal-actions" style={{ padding: '15px 20px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-cancel" onClick={() => setTextModal({ ...textModal, isOpen: false })} style={{ padding: '8px 16px', border: '1px solid #dee2e6', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryList;
