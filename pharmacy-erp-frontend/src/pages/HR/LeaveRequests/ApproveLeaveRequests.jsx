import { useState, useEffect, useContext, useRef } from "react";
import { AuthService } from "../../../services/AuthService";
import { toast } from "react-toastify";
import { FaCheck, FaTimes, FaFilter } from "react-icons/fa";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import "./ApproveLeaveRequests.scss";
import { AuthContext } from "../../../store/AuthContext";

export default function ApproveLeaveRequests() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        employeeId: "",
        startDate: "",
        endDate: ""
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [inputPage, setInputPage] = useState(1);
    const inputRef = useRef(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: null,
        status: "",
        title: "",
        message: "",
        type: "danger",
        approvalReason: "" // Thêm trường lý do duyệt
    });
    const [textModal, setTextModal] = useState({
        isOpen: false,
        title: "",
        content: ""
    });

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const params = { ...filters };
            Object.keys(params).forEach(key => {
                if (!params[key]) {
                    delete params[key];
                }
            });
            const res = await AuthService.getAllLeaveRequests(params);

            if (res && res.data) {
                setLeaveRequests(res.data);
            } else {
                setLeaveRequests(res || []);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách đơn xin nghỉ phép");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeaveRequests();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters]);

    const openConfirmModal = (id, status) => {
        const isApprove = status === "Approved" || status === "Approved_Salary";
        const isApprovedSalary = status === "Approved_Salary";
        setConfirmModal({
            isOpen: true,
            id,
            status,
            title: isApprove ? (isApprovedSalary ? "Xác nhận duyệt (Có lương)" : "Xác nhận duyệt đơn") : "Xác nhận từ chối đơn",
            message: isApprove ? (isApprovedSalary ? "Bạn có chắc chắn muốn duyệt đơn xin nghỉ phép này và VẪN TÍNH LƯƠNG?" : "Bạn có chắc chắn muốn duyệt đơn xin nghỉ phép này?") : "Bạn có chắc chắn muốn từ chối đơn xin nghỉ phép này?",
            type: isApprove ? "success" : "danger",
            approvalReason: "" // Reset lý do khi mở modal
        });
    };

    const handleConfirm = async () => {
        const { id, status, approvalReason } = confirmModal;
        const actionText = status === "Approved" ? "duyệt" : status === "Approved_Salary" ? "duyệt (có lương)" : "từ chối";

        if (!approvalReason || !approvalReason.trim()) {
            toast.warning("Vui lòng nhập lý do duyệt/từ chối đơn!");
            return;
        }

        try {
            await AuthService.approveLeaveRequest(id, status, approvalReason);
            toast.info(`Đã ${actionText} đơn nghỉ phép thành công`);
            fetchLeaveRequests();
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
            const msg = error.response?.data?.message || `Không thể ${actionText} đơn`;
            toast.error(msg);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Approved":
                return <span className="status-badge approved">Đã duyệt</span>;
            case "Approved_Salary":
                return <span className="status-badge approved">Duyệt (Có lương)</span>;
            case "Rejected":
                return <span className="status-badge rejected">Từ chối</span>;
            default:
                return <span className="status-badge pending">Chờ duyệt</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const resetFilters = () => {
        setFilters({
            status: "",
            employeeId: "",
            startDate: "",
            endDate: ""
        });
        setCurrentPage(1);
    };

    // Pagination Logic
    const totalPages = Math.ceil(leaveRequests.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = leaveRequests.slice(indexOfFirstItem, indexOfLastItem);

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

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    if (loading) return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải danh sách chờ duyệt..." /></div>;

    return (
        <div className="position-list-container">
            <div className="page-header">
                <h2 className="page-title">Duyệt Đơn Nghỉ Phép</h2>
            </div>

            <div className="filter-card">
                <div className="filter-form">
                    <div className="filter-group">
                        <label>Mã nhân viên</label>
                        <input
                            type="text"
                            placeholder="Nhập mã NV..."
                            className="form-control"
                            value={filters.employeeId}
                            onChange={(e) => setFilters(prev => ({ ...prev, employeeId: e.target.value }))}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Từ ngày</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Đến ngày</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Trạng thái</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="form-control"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="Pending">Chờ duyệt</option>
                            <option value="Approved">Đã duyệt</option>
                            <option value="Approved_Salary">Đã duyệt (Có lương)</option>
                            <option value="Rejected">Từ chối</option>
                        </select>
                    </div>
                    <div className="filter-actions">
                        <button type="button" className="btn-reset" onClick={resetFilters}>
                            Đặt lại
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="table-responsive">
                    <table className="position-table">
                        <thead>
                            <tr>
                                <th>Mã NV</th>
                                <th>Tên NV</th>
                                <th>Loại nghỉ</th>
                                <th>Từ ngày</th>
                                <th>Đến ngày</th>
                                <th>Lý do xin nghỉ</th>
                                <th>Lý do duyệt</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="no-data">Không có đơn xin nghỉ phép nào.</td>
                                </tr>
                            ) : (
                                currentItems.map((req) => (
                                    <tr key={req.id}>
                                        <td className="id-col">#{req.employeeId || "N/A"}</td>
                                        <td className="name-col">{req.employeeName || "N/A"}</td>
                                        <td>{req.leaveType}</td>
                                        <td>{formatDate(req.startDate)}</td>
                                        <td>{formatDate(req.endDate)}</td>
                                        <td
                                            className="reason-col"
                                            onClick={() => setTextModal({ isOpen: true, title: "Lý do xin nghỉ", content: req.reason })}
                                            title="Nhấn để xem chi tiết"
                                        >
                                            {req.reason}
                                        </td>
                                        <td
                                            className="reason-col"
                                            style={{ color: req.status === "Rejected" ? "red" : req.status === "Pending" ? "gray" : "green" }}
                                            onClick={() => {
                                                if (req.approvalReason) {
                                                    setTextModal({ isOpen: true, title: "Lý do duyệt", content: req.approvalReason });
                                                }
                                            }}
                                            title={req.approvalReason ? "Nhấn để xem chi tiết" : ""}
                                        >
                                            {req.approvalReason || (req.status === "Pending" ? "Chưa duyệt" : "")}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {getStatusBadge(req.status)}
                                                {req.approvedByUsername && req.status !== "Pending" && (
                                                    <span style={{ fontSize: '11px', color: '#868e96', textAlign: 'center' }}>
                                                        bởi: {req.approvedByUsername}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {req.status === "Pending" ? (
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn approve"
                                                        onClick={() => openConfirmModal(req.id, "Approved")}
                                                        title="Duyệt đơn"
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        className="action-btn approve-salary"
                                                        onClick={() => openConfirmModal(req.id, "Approved_Salary")}
                                                        title="Duyệt đơn (Có lương)"
                                                    >
                                                        Duyệt (Tính lương)
                                                    </button>
                                                    <button
                                                        className="action-btn reject"
                                                        onClick={() => openConfirmModal(req.id, "Rejected")}
                                                        title="Từ chối đơn"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, approvalReason: "" })}
                onConfirm={handleConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                showInput={true}
                inputValue={confirmModal.approvalReason}
                onInputChange={(val) => setConfirmModal({ ...confirmModal, approvalReason: val })}
                inputPlaceholder="Nhập lý do duyệt / từ chối đơn (Bắt buộc)..."
            />

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
}
