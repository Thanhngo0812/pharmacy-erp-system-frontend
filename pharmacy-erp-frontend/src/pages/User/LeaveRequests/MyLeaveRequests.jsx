import { useState, useEffect, useContext, useRef } from "react";
import { AuthService } from "../../../services/AuthService";
import { toast } from "react-toastify";
import { FaPlus, FaTrash } from "react-icons/fa";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import "./MyLeaveRequests.scss";
import { AuthContext } from "../../../store/AuthContext";

export default function MyLeaveRequests() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: "Sick Leave",
        startDate: "",
        endDate: "",
        reason: "",
        isPaidLeave: false,
    });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        id: null,
        title: "",
        message: "",
        type: "danger"
    });
    const [textModal, setTextModal] = useState({
        isOpen: false,
        title: "",
        content: ""
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [inputPage, setInputPage] = useState(1);
    const inputRef = useRef(null);

    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes("ROLE_ADMIN");

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const res = await AuthService.getMyLeaveRequests();
            // Assuming response wraps data in data array
            if (res && res.data) {
                setLeaveRequests(res.data);
            } else {
                setLeaveRequests(res || []);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách đơn nghỉ phép");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        try {
            const payload = {
                ...formData,
                startDate: formData.startDate + "T00:00:00",
                endDate: formData.endDate + "T00:00:00"
            };
            if (!isAdmin) {
                delete payload.isPaidLeave;
            }
            await AuthService.createLeaveRequest(payload);
            toast.success("Tạo đơn nghỉ phép thành công");
            setIsModalOpen(false);
            setFormData({
                leaveType: "Sick Leave",
                startDate: "",
                endDate: "",
                reason: "",
                isPaidLeave: false,
            });
            fetchLeaveRequests();
        } catch (error) {
            const msg = error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn";
            toast.error(msg);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            id,
            title: "Xác nhận hủy đơn",
            message: "Bạn có chắc chắn muốn hủy đơn xin nghỉ phép này?",
            type: "danger"
        });
    };

    const handleConfirmDelete = async () => {
        try {
            await AuthService.deleteLeaveRequest(confirmModal.id);
            toast.success("Hủy đơn thành công");
            fetchLeaveRequests();
        } catch (error) {
            const msg = error.response?.data?.message || "Không thể hủy đơn";
            toast.error(msg);
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
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

    // Format date helper (Date only)
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Helper to get minimum local date string (YYYY-MM-DD)
    const getMinDate = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 10);
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

    if (loading && leaveRequests.length === 0) {
        return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải danh sách đơn..." /></div>;
    }

    return (
        <div className="position-list-container">
            <div className="page-header">
                <h2 className="page-title">Đơn xin nghỉ phép của tôi</h2>
                <button className="btn-add" onClick={() => setIsModalOpen(true)}>
                    + Tạo mới
                </button>
            </div>

            <div className="table-card">
                <div className="table-responsive">
                    {loading ? (
                        <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải danh sách đơn..." /></div>
                    ) : (
                        <table className="position-table">
                            <thead>
                                <tr>
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
                                        <td colSpan="7" className="no-data">Bạn chưa có đơn xin nghỉ phép nào.</td>
                                    </tr>
                                ) : (
                                    currentItems.map((req) => (
                                        <tr key={req.id}>
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
                                                {req.status === "Pending" && (
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDelete(req.id)}
                                                            title="Hủy đơn"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
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

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content custom-form-modal">
                        <div className="modal-header">
                            <h3>Tạo Đơn Xin Nghỉ Phép</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Loại nghỉ</label>
                                    <select
                                        name="leaveType"
                                        value={formData.leaveType}
                                        onChange={handleInputChange}
                                        className="form-control"
                                    >
                                        <option value="Sick Leave">Sick Leave (Nghỉ ốm)</option>
                                        <option value="Personal Leave">Personal Leave (Nghỉ việc riêng)</option>
                                    </select>
                                </div>

                                <div className="form-group row">
                                    <div className="col">
                                        <label>Từ ngày</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            className="form-control"
                                            min={getMinDate()}
                                            required
                                        />
                                    </div>
                                    <div className="col">
                                        <label>Đến ngày</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            className="form-control"
                                            min={formData.startDate || getMinDate()}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Lý do</label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        rows="3"
                                        required
                                    ></textarea>
                                </div>

                                {isAdmin && (
                                    <div className="form-group checkbox-group" style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                                        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                name="isPaidLeave"
                                                checked={formData.isPaidLeave}
                                                onChange={(e) => setFormData({ ...formData, isPaidLeave: e.target.checked })}
                                                style={{ marginRight: "8px", width: "16px", height: "16px", cursor: "pointer" }}
                                            />
                                            <span>Nghỉ có lương (Sẽ tự động duyệt sang trạng thái Duyệt có lương)</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="btn-confirm success" disabled={!formData.reason.trim()}>
                                    Tạo mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
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
