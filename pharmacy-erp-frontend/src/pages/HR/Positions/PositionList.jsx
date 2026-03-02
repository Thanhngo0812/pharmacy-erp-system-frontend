import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from "../../../store/AuthContext";
import { AuthService } from "../../../services/AuthService";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./PositionList.scss";

const PositionList = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes("ROLE_ADMIN");
    const isHM = user?.roles?.includes("ROLE_HM");
    const navigate = useNavigate();

    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Jump to page state
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [inputPage, setInputPage] = useState(1);
    const inputRef = useRef(null);

    // Modals state
    // 1. Confirm Modal (Approve, Reject, Delete)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        position: null,
        type: "danger",
        title: "",
        message: "",
        actionType: "", // "delete", "approve", "reject"
        showInput: false
    });
    const [reason, setReason] = useState("");

    // 2. Form Modal (Create, Edit)
    const [formModal, setFormModal] = useState({
        isOpen: false,
        isEdit: false,
        id: null,
        positionName: "",
        reason: ""
    });

    // 3. Text Modal (View Reason)
    const [textModal, setTextModal] = useState({
        isOpen: false,
        title: "",
        content: ""
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPositions();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterStatus]); // Chạy lại khi search hoặc filter thay đổi

    const fetchPositions = async () => {
        setLoading(true);
        setError(null);
        try {
            const cleanParams = {};
            if (searchTerm.trim()) cleanParams.keyword = searchTerm.trim();
            if (filterStatus) cleanParams.status = filterStatus;

            const res = await AuthService.searchPositionsApi(cleanParams);
            if (res && res.data) {
                setPositions(res.data);
            }
        } catch (err) {
            setError("Không thể tải danh sách chức vụ.");
            toast.error("Lỗi khi tải dữ liệu chức vụ.");
        } finally {
            setLoading(false);
        }
    };

    // Form Modal Handlers (Create/Edit)
    const openCreateModal = () => {
        setFormModal({ isOpen: true, isEdit: false, id: null, positionName: "", reason: "" });
    };

    const openEditModal = (pos) => {
        setFormModal({ isOpen: true, isEdit: true, id: pos.id, positionName: pos.positionName, reason: pos.reason || "" });
    };

    const closeFormModal = () => {
        setFormModal({ ...formModal, isOpen: false });
    };

    const submitFormModal = async (e) => {
        e.preventDefault();
        const { isEdit, id, positionName } = formModal;
        if (!positionName.trim()) {
            toast.warning("Vui lòng nhập tên chức vụ.");
            return;
        }

        try {
            if (isEdit) {
                await AuthService.updatePositionNameApi(id, { positionName });
                toast.success("Cập nhật tên chức vụ thành công!");
            } else {
                await AuthService.createPositionApi({
                    positionName,
                    reason: formModal.reason.trim()
                });
                toast.success(isAdmin ? "Thêm chức vụ thành công!" : "Đã gửi yêu cầu thêm chức vụ (Chờ duyệt).");
            }
            closeFormModal();
            fetchPositions();
        } catch (err) {
            console.error(err);
            if (err.response?.status === 409) {
                toast.error("Tên chức vụ đã tồn tại.");
            } else {
                toast.error("Lỗi hệ thống khi lưu chức vụ.");
            }
        }
    };

    // Confirm Modal Handlers (Approve, Reject, Delete)
    const openConfirmModal = (pos, action) => {
        let type = "danger";
        let title = "";
        let message = "";
        let showInput = false;

        if (action === "delete") {
            title = "Xác nhận xóa chức vụ";
            message = `Bạn có chắc chắn muốn xóa chức vụ "${pos.positionName}"? Hành động này không thể hoàn tác.`;
        } else if (action === "approve") {
            type = "success";
            title = "Phê duyệt chức vụ";
            message = `Xác nhận phê duyệt chức vụ "${pos.positionName}".`;
            showInput = true;
        } else if (action === "reject") {
            title = "Từ chối chức vụ";
            message = `Xác nhận từ chối chức vụ "${pos.positionName}".`;
            showInput = true;
        }

        setReason("");
        setConfirmModal({
            isOpen: true,
            position: pos,
            type,
            title,
            message,
            actionType: action,
            showInput
        });
    };

    const handleConfirmAction = async () => {
        const { position, actionType } = confirmModal;
        const id = position.id;
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
            if (actionType === "delete") {
                await AuthService.deletePositionApi(id);
                toast.success("Đã xóa chức vụ thành công.");
            } else if (actionType === "approve" || actionType === "reject") {
                const statusStr = actionType === "approve" ? "Approved" : "Rejected";
                await AuthService.updatePositionStatusApi(id, {
                    status: statusStr,
                    approvalReason: reason.trim() || (actionType === "approve" ? "Đã duyệt" : "Từ chối cấp phép")
                });
                toast.success(actionType === "approve" ? "Đã phê duyệt chức vụ." : "Đã từ chối chức vụ.");
            }
            fetchPositions();
        } catch (err) {
            console.error(err);
            if (err.response?.status === 409) {
                toast.error(err.response.data?.message || "Lỗi xung đột dữ liệu.");
            } else {
                toast.error("Thao tác thất bại.");
            }
        }
    };

    // Calculate lists
    // Data is already filtered by API
    const totalPages = Math.ceil(positions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = positions.slice(indexOfFirstItem, indexOfLastItem);

    // Pagination handlers
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

    if (loading && positions.length === 0) {
        return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải danh sách chức vụ..." /></div>;
    }

    return (
        <div className="position-list-container">
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                showInput={confirmModal.showInput}
                inputValue={reason}
                onInputChange={setReason}
                inputPlaceholder="Nhập lý do..."
            />

            {/* Custom Edit/Create Form Modal */}
            {formModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content custom-form-modal">
                        <div className="modal-header">
                            <h3>{formModal.isEdit ? "Sửa tên chức vụ" : "Thêm mới chức vụ"}</h3>
                        </div>
                        <form onSubmit={submitFormModal}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Tên chức vụ <span style={{ color: "red" }}>*</span></label>
                                    <input
                                        type="text"
                                        value={formModal.positionName}
                                        onChange={(e) => setFormModal({ ...formModal, positionName: e.target.value })}
                                        placeholder="Nhập tên chức vụ (VD: Trưởng phòng)"
                                        autoFocus
                                    />
                                </div>
                                {!formModal.isEdit && (
                                    <div className="form-group" style={{ marginTop: '16px' }}>
                                        <label>Lý do đề xuất (tùy chọn)</label>
                                        <textarea
                                            value={formModal.reason}
                                            onChange={(e) => setFormModal({ ...formModal, reason: e.target.value })}
                                            placeholder="Nhập lý do tạo chức vụ mới..."
                                            rows={3}
                                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ced4da", fontFamily: "inherit" }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeFormModal}>Hủy</button>
                                <button type="submit" className="btn-confirm success" disabled={!formModal.positionName.trim()}>
                                    {formModal.isEdit ? "Cập nhật" : "Tạo mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="page-header">
                <h2 className="page-title">Quản lý chức vụ</h2>
                <button className="btn-add" onClick={openCreateModal}>
                    + Thêm mới
                </button>
            </div>

            <div className="filter-card">
                <div className="filter-form">
                    <div className="filter-group">
                        <input
                            type="text"
                            name="keyword"
                            placeholder="Tìm kiếm theo tên chức vụ..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            name="status"
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">-- Tất cả trạng thái --</option>
                            <option value="Approved">Đã duyệt</option>
                            <option value="Pending">Chờ duyệt</option>
                            <option value="Rejected">Từ chối</option>
                        </select>
                    </div>
                </div>
            </div>

            {error ? <div className="error-message">{error}</div> : (
                <div className="table-card">
                    <div className="table-responsive">
                        <table className="position-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên chức vụ</th>
                                    <th>Trạng thái</th>
                                    <th>Người đề xuất</th>
                                    <th>Người duyệt</th>
                                    <th>Lý do</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((pos) => (
                                        <tr key={pos.id}>
                                            <td className="id-col">#{pos.id}</td>
                                            <td className="name-col">{pos.positionName}</td>
                                            <td>
                                                <span className={`status-badge ${pos.status?.toLowerCase()}`}>
                                                    {pos.status === 'Approved' ? 'Đã duyệt' : pos.status === 'Pending' ? 'Chờ duyệt' : 'Từ chối'}
                                                </span>
                                            </td>
                                            <td>
                                                {pos.proposedByName ? (
                                                    <span
                                                        className="user-ref pointer"
                                                        onClick={() => navigate(`/admin/employees/${pos.proposedById}`)}
                                                    >
                                                        {pos.proposedByName} (ID: {pos.proposedById})
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td>
                                                {pos.approvedByName ? (
                                                    <span
                                                        className="user-ref pointer"
                                                        onClick={() => navigate(`/admin/employees/${pos.approvedById}`)}
                                                    >
                                                        {pos.approvedByName} (ID: {pos.approvedById})
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td className="reason-col" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                                {pos.reason && (
                                                    <div
                                                        className="reason-item proposal"
                                                        onClick={() => setTextModal({ isOpen: true, title: "Lý do đề xuất", content: pos.reason })}
                                                        title="Nhấn để xem chi tiết"
                                                    >
                                                        <b>Đề xuất:</b> {pos.reason}
                                                    </div>
                                                )}
                                                {pos.approvalReason && (
                                                    <div
                                                        className={`reason-item ${pos.status === 'Approved' ? 'approved' : 'rejected'}`}
                                                        onClick={() => setTextModal({ isOpen: true, title: pos.status === 'Approved' ? "Lý do duyệt" : "Lý do từ chối", content: pos.approvalReason })}
                                                        title="Nhấn để xem chi tiết"
                                                    >
                                                        <b>{pos.status === 'Approved' ? 'Duyệt:' : 'Từ chối:'}</b> {pos.approvalReason}
                                                    </div>
                                                )}
                                                {!pos.reason && !pos.approvalReason && "-"}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {/* Quyền SỬA tên chức vụ: Chỉ Admin */}
                                                    {isAdmin && (
                                                        <button className="action-btn edit" onClick={() => openEditModal(pos)}>Sửa</button>
                                                    )}

                                                    {/* Quyền XÓA: Admin hoặc (HM & là người đề xuất) */}
                                                    {(isAdmin || (isHM && (pos.proposedById == user?.id || pos.proposedById == user?.employeeId || pos.proposedById == user?.userId))) && (
                                                        <button className="action-btn delete" onClick={() => openConfirmModal(pos, "delete")}>Xóa</button>
                                                    )}

                                                    {/* Quyền DUYỆT/TỪ CHỐI: Chỉ Admin mới thấy và chỉ áp dụng cho Pending */}
                                                    {isAdmin && pos.status === "Pending" && (
                                                        <>
                                                            <button className="action-btn approve" onClick={() => openConfirmModal(pos, "approve")}>Duyệt</button>
                                                            <button className="action-btn reject" onClick={() => openConfirmModal(pos, "reject")}>Từ chối</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="no-data">Không tìm thấy chức vụ nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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

export default PositionList;
