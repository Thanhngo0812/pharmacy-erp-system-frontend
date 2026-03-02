import { useEffect, useState, useRef, useContext } from "react";
import { AuthContext } from "../../../store/AuthContext";
import { AuthService } from "../../../services/AuthService";
import { useNavigate } from "react-router-dom";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { toast } from "react-toastify";
import "./BonusList.scss";

const BonusList = ({ embedded = false }) => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes("ROLE_ADMIN");
    const isHM = user?.roles?.includes("ROLE_HM");
    const canAction = isAdmin || isHM;
    const navigate = useNavigate();

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    const [bonuses, setBonuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", type: "success", actionType: "", bonusIds: [], isBulk: false
    });
    const [actionReason, setActionReason] = useState("");

    const [editModal, setEditModal] = useState({
        isOpen: false, isBulk: false, bonusIds: [], bonusName: "", endDate: ""
    });

    const [textModal, setTextModal] = useState({
        isOpen: false, title: "", content: ""
    });

    const [historyModal, setHistoryModal] = useState({
        isOpen: false, bonusName: "", history: [], loading: false
    });

    const [createModal, setCreateModal] = useState({
        isOpen: false,
        employeeIds: [],
        bonusName: "",
        amount: "",
        monthPicker: "",
        startDate: "",
        endDate: "",
        reason: "",
        type: "Bonus" // "Bonus" hoặc "Deduction"
    });
    const [employeeList, setEmployeeList] = useState([]);

    useEffect(() => {
        const fetchEligibleEmps = async () => {
            if (createModal.isOpen && createModal.startDate) {
                try {
                    const res = await AuthService.getEligibleEmployees({
                        startDate: createModal.startDate,
                        endDate: createModal.endDate || undefined
                    });
                    if (res?.data) {
                        const eligibleList = res.data;
                        setEmployeeList(eligibleList);
                        // Bỏ chọn những NV không còn trong danh sách đủ điều kiện
                        const eligibleIds = eligibleList.map(emp => emp.id || emp.employeeId);
                        setCreateModal(prev => ({
                            ...prev,
                            employeeIds: prev.employeeIds.filter(id => eligibleIds.includes(id))
                        }));
                    }
                } catch (err) {
                    console.error("Lỗi lấy danh sách NV đủ điều kiện", err);
                    setEmployeeList([]);
                }
            } else if (!createModal.isOpen) {
                // Reset khi form đóng
                setEmployeeList([]);
            }
        };
        fetchEligibleEmps();
    }, [createModal.isOpen, createModal.startDate, createModal.endDate]);

    // Filters
    const [filters, setFilters] = useState({
        bonusName: "",
        status: "",
        minAmount: "",
        maxAmount: "",
        startDate: "",
        sortDirection: "desc"
    });

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAmountInputChange = (e) => {
        const { name, value } = e.target;
        const rawValue = stripNonDigits(value);
        setFilters((prev) => ({
            ...prev,
            [name]: rawValue,
        }));
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [inputPage, setInputPage] = useState(1);
    const inputRef = useRef(null);

    // Modal state for viewing employees
    const [employeeModal, setEmployeeModal] = useState({
        isOpen: false,
        bonusName: "",
        employees: []
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchBonuses();
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const fetchBonuses = async () => {
        setLoading(true);
        setError(null);
        try {
            const cleanParams = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== "")
            );
            // API mới dùng minAmount/maxAmount thay vì amount
            const response = await AuthService.getBonuses(cleanParams);
            if (response && response.data) {
                setBonuses(response.data || []);
            }
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError("Bạn không có quyền xem danh sách khoản thưởng.");
            } else {
                setError("Không thể tải danh sách khoản thưởng.");
                toast.error("Lỗi khi tải dữ liệu trợ cấp.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchBonusHistory = async (item) => {
        const label = item.employeeName || item.bonusName || `Bonus #${item.bonusId}`;
        setHistoryModal({ isOpen: true, bonusName: label, history: [], loading: true });
        try {
            const response = await AuthService.getBonusToggleHistory(item.bonusId);
            setHistoryModal(prev => ({ ...prev, history: response.data || response || [], loading: false }));
        } catch (err) {
            toast.error("Không thể tải lịch sử bật/tắt.");
            setHistoryModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleReset = () => {
        setFilters({
            bonusName: "",
            status: "",
            minAmount: "",
            maxAmount: "",
            startDate: "",
            endDate: "",
            sortDirection: "desc"
        });
    };

    // Pagination logic
    const totalPages = Math.ceil(bonuses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBonuses = bonuses.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageClick = () => {
        setIsEditingPage(true);
        setInputPage(currentPage);
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const submitPage = () => {
        setIsEditingPage(false);
        let pageNumber = parseInt(inputPage);
        if (isNaN(pageNumber) || pageNumber < 1) pageNumber = 1;
        else if (pageNumber > totalPages) pageNumber = totalPages;
        setCurrentPage(pageNumber);
    };

    // Formatter
    const formatCurrency = (amount) =>
        amount != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount) : "---";
    const formatDate = (dateString) =>
        dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "---";

    const getStatusLabel = (status) => {
        const map = {
            Pending: "Chờ duyệt",
            Approved: "Đã duyệt",
            Rejected: "Từ chối"
        };
        return map[status] || status;
    };

    const openEmployeeModal = (bonusGroup) => {
        setEmployeeModal({
            isOpen: true,
            bonusName: bonusGroup.bonusName,
            endDate: bonusGroup.endDate, // store endDate to pass to child if needed
            employees: bonusGroup.employees || []
        });
    };

    const openActionModal = (data, action, isBulk) => {
        setActionReason("");
        let ids = [];
        if (isBulk) {
            if (action === 'delete') {
                ids = data.employees.filter(e => e.status === 'Rejected').map(e => e.bonusId);
                if (ids.length === 0) return toast.warning("Không có trợ cấp nào bị từ chối trong nhóm để xoá.");
            } else {
                ids = data.employees.filter(e => e.status === 'Pending').map(e => e.bonusId);
                if (ids.length === 0) return toast.warning("Không có trợ cấp nào chờ duyệt trong nhóm.");
            }
        } else {
            ids = [data.bonusId];
        }

        // Ẩn bảng nhân viên nếu đang mở
        if (action !== 'toggle') {
            setEmployeeModal(prev => ({ ...prev, isOpen: false }));
        }

        let title = 'Xoá trợ cấp';
        let message = `Xác nhận xoá ${ids.length} khoản trợ cấp này? Hành động không thể hoàn tác!`;
        if (action === 'approve') {
            title = 'Duyệt trợ cấp';
            message = `Xác nhận duyệt ${ids.length} khoản trợ cấp này?`;
        } else if (action === 'reject') {
            title = 'Từ chối trợ cấp';
            message = `Xác nhận từ chối ${ids.length} khoản trợ cấp này?`;
        } else if (action === 'toggle') {
            title = data.isActive ? 'Tắt trợ cấp' : 'Bật trợ cấp';
            message = `Bạn có chắc chắn muốn ${data.isActive ? 'TẮT' : 'BẬT'} trạng thái áp dụng trợ cấp này?`;
        }

        setConfirmModal({
            isOpen: true,
            title,
            message,
            type: action === 'approve' || action === 'toggle' ? 'success' : 'danger',
            actionType: action,
            bonusIds: ids,
            isBulk,
            targetData: data // Lưu data để dùng lúc toggle
        });
    };

    const handleConfirmAction = async () => {
        const { bonusIds, actionType, isBulk, targetData } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
            if (actionType === 'delete') {
                await AuthService.deleteBonuses(bonusIds);
                toast.info('Xoá thành công!');
            } else if (actionType === 'toggle') {
                const newStatus = !targetData.isActive;
                await AuthService.toggleActiveBonus({
                    bonusIds: bonusIds,
                    isActive: newStatus,
                    reason: actionReason.trim()
                });
                toast.success(`Đã ${newStatus ? 'Bật' : 'Tắt'} trợ cấp thành công!`);
                // Cập nhật giao diện mượt
                setEmployeeModal(prev => ({
                    ...prev,
                    employees: prev.employees.map(e => e.bonusId === targetData.bonusId ? { ...e, isActive: newStatus } : e)
                }));
            } else {
                const payload = { status: actionType === 'approve' ? 'Approved' : 'Rejected', approvalReason: actionReason.trim() };
                if (isBulk) await AuthService.bulkApproveRejectBonus({ bonusIds, ...payload });
                else await AuthService.approveRejectBonus(bonusIds[0], payload);
                toast.success(actionType === 'approve' ? 'Duyệt thành công!' : 'Từ chối thành công!');
            }

            if (!isBulk && actionType !== 'toggle') setEmployeeModal(prev => ({ ...prev, isOpen: false }));
            fetchBonuses();
        } catch (error) {
            toast.error("Thao tác thất bại.");
        }
    };

    const openEditModal = (data, isBulk) => {
        let ids = isBulk ? data.employees.map(e => e.bonusId) : [data.bonusId];

        // Ẩn bảng nhân viên nếu đang mở
        setEmployeeModal(prev => ({ ...prev, isOpen: false }));

        setEditModal({
            isOpen: true,
            isBulk,
            bonusIds: ids,
            bonusName: data.bonusName || "",
            startDate: data.startDate || "",
            endDate: data.endDate && data.endDate !== "---" ? data.endDate : ""
        });
    };

    const handleUpdateBonus = async (e) => {
        e.preventDefault();

        if (editModal.endDate && editModal.startDate && new Date(editModal.endDate) < new Date(editModal.startDate)) {
            return toast.warning("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
        }

        try {
            const payload = { bonusName: editModal.bonusName, endDate: editModal.endDate || null };
            if (editModal.isBulk) await AuthService.bulkUpdateBonus({ bonusIds: editModal.bonusIds, ...payload });
            else await AuthService.updateBonus(editModal.bonusIds[0], payload);

            toast.success("Cập nhật thành công!");
            setEditModal({ ...editModal, isOpen: false });
            if (!editModal.isBulk) setEmployeeModal(prev => ({ ...prev, isOpen: false }));
            fetchBonuses();
        } catch (err) {
            toast.error("Lỗi cập nhật.");
        }
    };

    const handleMonthChange = (e) => {
        const val = e.target.value; // YYYY-MM
        if (val) {
            const date = new Date(`${val}-01`);
            const year = date.getFullYear();
            const month = date.getMonth();
            const lastDay = new Date(year, month + 1, 0);

            // Format YYYY-MM-DD - Lấy ngày cuối của tháng làm start và end
            const yyyyMm = val;
            const yyyyMmDd = `${yyyyMm}-${lastDay.getDate().toString().padStart(2, '0')}`;

            setCreateModal({
                ...createModal,
                monthPicker: val,
                startDate: yyyyMmDd,
                endDate: yyyyMmDd
            });
        } else {
            setCreateModal({
                ...createModal,
                monthPicker: "",
                startDate: "",
                endDate: ""
            });
        }
    };

    const handleCreateBonus = async (e) => {
        e.preventDefault();
        if (createModal.employeeIds.length === 0) {
            return toast.warning("Vui lòng chọn ít nhất 1 nhân viên!");
        }

        if (createModal.endDate && new Date(createModal.startDate) > new Date(createModal.endDate)) {
            return toast.warning("Ngày kết thúc phải lớn hơn hoặc bằng ngày áp dụng!");
        }
        try {
            const payload = {
                employeeIds: createModal.employeeIds,
                bonusName: createModal.bonusName,
                amount: createModal.type === "Deduction" ? -Math.abs(parseFloat(createModal.amount)) : Math.abs(parseFloat(createModal.amount)),
                startDate: createModal.startDate,
                endDate: createModal.endDate || null,
                reason: createModal.reason || null
            };
            await AuthService.createBonus(payload);
            toast.success("Tạo mới khoản trợ cấp thành công!");
            setCreateModal({
                isOpen: false,
                employeeIds: [],
                bonusName: "",
                amount: "",
                monthPicker: "",
                startDate: "",
                endDate: "",
                reason: "",
                type: "Bonus"
            });
            fetchBonuses();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tạo mới khoản trợ cấp.");
        }
    };

    const toggleEmployeeSelect = (empId) => {
        setCreateModal(prev => {
            const exists = prev.employeeIds.includes(empId);
            return {
                ...prev,
                employeeIds: exists ? prev.employeeIds.filter(id => id !== empId) : [...prev.employeeIds, empId]
            };
        });
    };

    const toggleSelectAll = () => {
        setCreateModal(prev => {
            if (prev.employeeIds.length === employeeList.length) {
                return { ...prev, employeeIds: [] };
            } else {
                return { ...prev, employeeIds: employeeList.map(e => e.id || e.employeeId) };
            }
        });
    };

    if (loading && bonuses.length === 0) {
        return <div className="loading-overlay"><LoadingSpinnerMini fullScreen={false} text="Đang tải dữ liệu..." /></div>;
    }

    return (
        <div className={`bonus-list-container ${embedded ? 'embedded' : ''}`}>
            {historyModal.isOpen && (
                <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setHistoryModal({ ...historyModal, isOpen: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
                        <div className="modal-header" style={{ backgroundColor: '#65A7E3', position: 'relative' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '16px', textAlign: 'center', width: '100%' }}>
                                Lịch sử bật/tắt: {historyModal.bonusName}
                            </h3>
                            <button className="btn-close" onClick={() => setHistoryModal({ ...historyModal, isOpen: false })} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'white' }}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                            {historyModal.loading ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#868e96' }}>
                                    <LoadingSpinnerMini />
                                </div>
                            ) : historyModal.history.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#868e96', textTransform: 'uppercase' }}>Thời gian</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#868e96', textTransform: 'uppercase' }}>Trạng thái</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#868e96', textTransform: 'uppercase' }}>Người thực hiện</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#868e96', textTransform: 'uppercase' }}>Lý do</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyModal.history.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #e9ecef' }}>
                                                <td style={{ padding: '10px 12px', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                    {item.toggledAt ? new Date(item.toggledAt).toLocaleString('vi-VN') : '---'}
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                                        background: item.isActive ? 'rgba(64, 192, 87, 0.1)' : 'rgba(250, 82, 82, 0.1)',
                                                        color: item.isActive ? '#40c057' : '#fa5252'
                                                    }}>
                                                        {item.isActive ? 'Bật (Active)' : 'Tắt (Inactive)'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#1c7ed6', fontWeight: 500 }}>
                                                    {item.toggledByName || '---'}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px', fontSize: '13px', color: '#495057',
                                                        maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        cursor: item.reason ? 'pointer' : 'default'
                                                    }}
                                                    title={item.reason || ''}
                                                    onClick={() => {
                                                        if (item.reason) {
                                                            setTextModal({
                                                                isOpen: true,
                                                                title: "Chi tiết lý do thay đổi",
                                                                content: item.reason
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {item.reason || '---'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#868e96', fontStyle: 'italic' }}>
                                    Chưa có lịch sử bật/tắt nào.
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'flex-end', background: '#f8f9fa', borderRadius: '0 0 8px 8px' }}>
                            <button onClick={() => setHistoryModal({ ...historyModal, isOpen: false })} style={{ padding: '8px 16px', border: '1px solid #dee2e6', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#868e96' }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                showInput={confirmModal.actionType !== 'delete'}
                inputValue={actionReason}
                onInputChange={setActionReason}
                inputPlaceholder="Nhập lý do..."
            />

            {editModal.isOpen && (
                <div className="modal-overlay" onClick={() => setEditModal({ ...editModal, isOpen: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header" style={{ backgroundColor: '#65A7E3', position: 'relative' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '16px', textAlign: 'center', width: '100%' }}>Sửa thông tin</h3>
                            <button className="btn-close" onClick={() => setEditModal({ ...editModal, isOpen: false })} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'white' }}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleUpdateBonus}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tên khoản thưởng *</label>
                                    <input type="text" className="form-control" style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '6px' }} value={editModal.bonusName} onChange={e => setEditModal({ ...editModal, bonusName: e.target.value })} required />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Ngày kết thúc</label>
                                    <input type="date" className="form-control" style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '6px' }} value={editModal.endDate} onChange={e => setEditModal({ ...editModal, endDate: e.target.value })} />
                                    <small style={{ color: '#868e96' }}>Bỏ trống nếu là vô thời hạn.</small>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                    <button type="button" className="btn-default" style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer' }} onClick={() => setEditModal({ ...editModal, isOpen: false })}>Bỏ qua</button>
                                    <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', background: '#65A7E3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Lưu thay đổi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {textModal.isOpen && (
                <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setTextModal({ ...textModal, isOpen: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header primary" style={{ backgroundColor: '#65A7E3', position: 'relative' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '16px', textAlign: 'center', width: '100%' }}>{textModal.title}</h3>
                            <button className="btn-close" onClick={() => setTextModal({ ...textModal, isOpen: false })} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'white' }}>&times;</button>
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

            {createModal.isOpen && (
                <div className="modal-overlay custom-form-overlay">
                    <div className="modal-content custom-form-modal">
                        <div className="modal-header">
                            <h3 style={{ color: 'white', textAlign: 'center', width: '100%', margin: 0 }}>
                                Tạo mới khoản {isAdmin ? 'bù/khấu trừ (Tự động duyệt)' : 'bù/khấu trừ (Chờ duyệt)'}
                            </h3>
                            <button className="btn-close" onClick={() => setCreateModal({ ...createModal, isOpen: false })} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'white' }}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateBonus}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Tên lý do thưởng/phạt <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={createModal.bonusName} onChange={e => setCreateModal({ ...createModal, bonusName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Loại hình <span style={{ color: 'red' }}>*</span></label>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                                            <input
                                                type="radio"
                                                name="bonusType"
                                                value="Bonus"
                                                checked={createModal.type === "Bonus"}
                                                onChange={() => setCreateModal({ ...createModal, type: "Bonus" })}
                                                style={{ width: 'auto', margin: 0 }}
                                            />
                                            <span style={{ color: '#40c057' }}>Thưởng (Cộng vào lương)</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                                            <input
                                                type="radio"
                                                name="bonusType"
                                                value="Deduction"
                                                checked={createModal.type === "Deduction"}
                                                onChange={() => setCreateModal({ ...createModal, type: "Deduction" })}
                                                style={{ width: 'auto', margin: 0 }}
                                            />
                                            <span style={{ color: '#fa5252' }}>Phạt / Khấu trừ (Trừ vào lương)</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Số tiền (VNĐ) <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: 500.000"
                                        value={formatInputNumber(createModal.amount)}
                                        onChange={e => setCreateModal({ ...createModal, amount: stripNonDigits(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#1c7ed6' }}>Chọn Tháng/Năm nhanh</label>
                                    <input type="month" value={createModal.monthPicker} onChange={handleMonthChange} />
                                    <small style={{ color: '#868e96', marginTop: '4px' }}>Hệ thống sẽ dùng ngày cuối của tháng làm ngày kết thúc.</small>
                                </div>
                                {!createModal.monthPicker && (
                                    <div className="form-group row">
                                        <div className="col">
                                            <label>Ngày bắt đầu hiệu lực <span style={{ color: 'red' }}>*</span></label>
                                            <input type="date" value={createModal.startDate} onChange={e => setCreateModal({ ...createModal, startDate: e.target.value })} required />
                                        </div>
                                        <div className="col">
                                            <label>Ngày kết thúc</label>
                                            <input type="date" value={createModal.endDate} min={createModal.startDate} onChange={e => setCreateModal({ ...createModal, endDate: e.target.value })} />
                                        </div>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Ghi chú khởi tạo</label>
                                    <textarea rows="2" value={createModal.reason} onChange={e => setCreateModal({ ...createModal, reason: e.target.value })} placeholder="Nhập ghi chú..."></textarea>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ margin: 0 }}>Chọn nhân viên nhận ({createModal.employeeIds.length} người) <span style={{ color: 'red' }}>*</span></label>
                                        {createModal.startDate && (
                                            <button type="button" onClick={toggleSelectAll} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', background: '#e7f5ff', color: '#1c7ed6', border: '1px solid #74c0fc', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                {employeeList.length > 0 && createModal.employeeIds.length === employeeList.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                            </button>
                                        )}
                                    </div>
                                    {!createModal.startDate ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#868e96', background: '#f8f9fa', borderRadius: '4px', border: '1px dashed #ced4da', fontStyle: 'italic', fontSize: '14px' }}>
                                            <i className="bi bi-calendar-event" style={{ fontSize: '24px', display: 'block', marginBottom: '8px', color: '#adb5bd' }}></i>
                                            Vui lòng chọn ngày áp dụng để hiển thị danh sách nhân sự thỏa điều kiện
                                        </div>
                                    ) : (
                                        <div className="table-container" style={{ border: '1px solid #dee2e6', borderRadius: '4px', background: '#fff' }}>
                                            {employeeList.length > 0 ? employeeList.map(emp => {
                                                const eId = emp.id || emp.employeeId;
                                                return (
                                                    <div key={eId} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => toggleEmployeeSelect(eId)}>
                                                        <input type="checkbox" checked={createModal.employeeIds.includes(eId)} readOnly style={{ cursor: 'pointer', width: 'auto', marginBottom: 0, marginTop: 0 }} />
                                                        <span style={{ cursor: 'pointer', fontSize: '14px', flex: 1 }}>{emp.lastName} {emp.firstName} (ID: {eId}) - {emp.positionName || emp.position}</span>
                                                    </div>
                                                );
                                            }) : <div style={{ padding: '15px', textAlign: 'center', color: '#868e96', fontSize: '14px' }}>Không có nhân viên thỏa điều kiện nào.</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', borderRadius: '0 0 8px 8px' }}>
                                <button type="button" onClick={() => setCreateModal({ ...createModal, isOpen: false })} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #dee2e6', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#868e96' }}>Bỏ qua</button>
                                <button type="submit" disabled={!createModal.employeeIds.length || !createModal.amount.trim() || !createModal.bonusName.trim()} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#65A7E3', color: 'white', cursor: 'pointer', fontWeight: 600, opacity: (!createModal.employeeIds.length || !createModal.amount.trim() || !createModal.bonusName.trim()) ? 0.5 : 1 }}>
                                    + Tạo mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {!embedded && (
                <div className="page-header">
                    <h2 className="page-title">Quản lý Thưởng / Trợ cấp</h2>
                </div>
            )}
            <div className={embedded ? "page-header embedded-header" : "page-header"}>
                {embedded && <span></span>}
                <button
                    className="btn-add"
                    onClick={() => setCreateModal({ ...createModal, isOpen: true })}
                >
                    + Tạo khoản bù/khấu trừ
                </button>
            </div>

            <div className="filter-card">
                <div className="filter-form">
                    <div className="filter-group">
                        <label>Tìm kiếm tên</label>
                        <input
                            type="text"
                            name="bonusName"
                            placeholder="Tìm theo tên..."
                            value={filters.bonusName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="filter-group salary-range-group">
                        <div className="range-input-wrapper">
                            <label>Tiền từ</label>
                            <input
                                type="text"
                                name="minAmount"
                                placeholder="Từ..."
                                value={formatInputNumber(filters.minAmount)}
                                onChange={handleAmountInputChange}
                            />
                        </div>
                        <span className="range-separator">-</span>
                        <div className="range-input-wrapper">
                            <label>đến</label>
                            <input
                                type="text"
                                name="maxAmount"
                                placeholder="Đến..."
                                value={formatInputNumber(filters.maxAmount)}
                                onChange={handleAmountInputChange}
                            />
                        </div>
                    </div>
                    <div className="filter-group">
                        <label>Trạng thái</label>
                        <select name="status" value={filters.status} onChange={handleInputChange}>
                            <option value="">-- Tất cả --</option>
                            <option value="Pending">Chờ duyệt</option>
                            <option value="Approved">Đã duyệt</option>
                            <option value="Rejected">Từ chối</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Từ ngày</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Đến ngày</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="filter-group sort-group">
                        <div className="sort-input-wrapper">
                            <label>Sắp xếp</label>
                            <select name="sortDirection" value={filters.sortDirection} onChange={handleInputChange}>
                                <option value="desc">Tiền: Cao → Thấp</option>
                                <option value="asc">Tiền: Thấp → Cao</option>
                            </select>
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button type="button" onClick={handleReset} className="btn-reset">Đặt lại</button>
                    </div>
                </div>
            </div>

            {
                error ? (
                    <div className="error-message" style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>
                ) : (
                    <div className="table-card">
                        <div className="table-responsive">
                            <table className="bonus-table">
                                <thead>
                                    <tr>
                                        <th>Khoản thưởng</th>
                                        <th>Số tiền / tháng</th>
                                        <th>Từ ngày</th>
                                        <th>Đến ngày</th>
                                        <th>Thông tin duyệt</th>
                                        <th>Trạng thái</th>
                                        <th>Số NV</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentBonuses.length > 0 ? (
                                        currentBonuses.map((bonus, index) => (
                                            <tr key={index}>
                                                <td className="name-cell">
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontWeight: 600 }}>{bonus.bonusName}</span>
                                                        <span className={`type-badge ${bonus.amount < 0 ? 'deduction' : 'bonus'}`}>
                                                            {bonus.amount < 0 ? 'Khấu trừ / Phạt' : 'Thưởng / Trợ cấp'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`amount-text ${bonus.amount < 0 ? 'text-danger' : 'text-success'}`}>
                                                    {bonus.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(bonus.amount))}
                                                </td>
                                                <td>{formatDate(bonus.startDate)}</td>
                                                <td>{formatDate(bonus.endDate) === "---" ? "Vô thời hạn" : formatDate(bonus.endDate)}</td>
                                                <td className="info-cell">
                                                    <div className="info-item">
                                                        <span className="label">Đề xuất:</span>
                                                        <span
                                                            className={bonus.proposedById ? "value text-primary pointer-hover" : "value text-primary"}
                                                            onClick={() => bonus.proposedById && navigate(`/admin/employees/${bonus.proposedById}`)}
                                                            title={bonus.proposedById ? "Nhấn để xem hồ sơ" : ""}
                                                        >
                                                            {bonus.proposedByName || "---"}
                                                        </span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="label">Lý do:</span>
                                                        <span
                                                            className="value pointer-hover"
                                                            title="Nhấn để xem chi tiết"
                                                            onClick={() => {
                                                                if (bonus.reason) setTextModal({ isOpen: true, title: "Lý do đề xuất", content: bonus.reason })
                                                            }}
                                                        >
                                                            {bonus.reason || "---"}
                                                        </span>
                                                    </div>
                                                    {(bonus.status === 'Approved' || bonus.status === 'Rejected') && (
                                                        <>
                                                            <div className="info-item mt-1">
                                                                <span className="label">Người duyệt:</span>
                                                                <span
                                                                    className={bonus.approvedById ? `value ${bonus.status === 'Approved' ? 'text-success' : 'text-danger'} pointer-hover` : `value ${bonus.status === 'Approved' ? 'text-success' : 'text-danger'}`}
                                                                    onClick={() => bonus.approvedById && navigate(`/admin/employees/${bonus.approvedById}`)}
                                                                    title={bonus.approvedById ? "Nhấn để xem hồ sơ" : ""}
                                                                >
                                                                    {bonus.approvedByName || "---"}
                                                                </span>
                                                            </div>
                                                            <div className="info-item">
                                                                <span className="label">Lý do duyệt:</span>
                                                                <span
                                                                    className="value pointer-hover"
                                                                    title="Nhấn để xem chi tiết"
                                                                    onClick={() => {
                                                                        if (bonus.approvalReason) setTextModal({ isOpen: true, title: "Lý do duyệt", content: bonus.approvalReason })
                                                                    }}
                                                                >
                                                                    {bonus.approvalReason || "---"}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${bonus.status?.toLowerCase()}`}>
                                                        {getStatusLabel(bonus.status)}
                                                    </span>
                                                </td>
                                                <td><b>{bonus.employeeCount}</b> <span style={{ fontSize: '12px', color: '#868e96' }}>(đang áp dụng: {bonus.activeCount})</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                        <button className="btn-view-details" onClick={() => openEmployeeModal(bonus)}>Danh sách</button>
                                                        {isAdmin && bonus.status === 'Pending' && (
                                                            <>
                                                                <button className="btn-view-details" style={{ background: '#d4edda', color: '#155724', borderColor: '#c3e6cb' }} onClick={() => openActionModal(bonus, 'approve', true)}>Duyệt Group</button>
                                                                <button className="btn-view-details" style={{ background: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' }} onClick={() => openActionModal(bonus, 'reject', true)}>Từ chối Group</button>
                                                            </>
                                                        )}
                                                        {isAdmin && bonus.status !== 'Rejected' && (
                                                            <button className="btn-view-details" style={{ background: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }} onClick={() => openEditModal(bonus, true)}>Sửa Group</button>
                                                        )}
                                                        {isAdmin && bonus.status === 'Rejected' && (
                                                            <button className="btn-view-details" style={{ background: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' }} onClick={() => openActionModal(bonus, 'delete', true)}>Xoá Group</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#868e96" }}>
                                                Không tìm thấy nhóm trợ cấp nào.
                                            </td>
                                        </tr>
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
                                            onChange={(e) => setInputPage(e.target.value)}
                                            onBlur={submitPage}
                                            onKeyDown={(e) => e.key === "Enter" && submitPage()}
                                            min="1"
                                            max={totalPages}
                                        />
                                    ) : (
                                        <span className="page-text" onClick={handlePageClick} title="Nhấn để nhập số trang">
                                            Trang <b>{currentPage}</b> / {totalPages}
                                        </span>
                                    )}
                                </div>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>&gt;</button>
                            </div>
                        )}
                    </div>
                )
            }

            {
                employeeModal.isOpen && (
                    <div className="modal-overlay" onClick={() => setEmployeeModal({ ...employeeModal, isOpen: false })}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header" style={{ backgroundColor: '#65A7E3', position: 'relative' }}>
                                <h3 style={{ color: 'white', margin: 0, fontSize: '16px', textAlign: 'center', width: '100%' }}>Nhân viên nhận: {employeeModal.bonusName}</h3>
                                <button className="btn-close" onClick={() => setEmployeeModal({ ...employeeModal, isOpen: false })} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'white' }}>&times;</button>
                            </div>
                            <div className="modal-body">
                                {employeeModal.employees.length > 0 ? (
                                    <table className="emp-list-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Họ tên</th>
                                                <th>Chức vụ</th>
                                                <th>Trạng thái (áp dụng)</th>
                                                {canAction && <th>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeModal.employees.map(emp => (
                                                <tr key={emp.employeeId}>
                                                    <td className="pointer-hover" style={{ color: '#868e96' }} onClick={() => navigate(`/admin/employees/${emp.employeeId}`)} title="Xem hồ sơ">#{emp.employeeId}</td>
                                                    <td className="emp-name pointer-hover" onClick={() => navigate(`/admin/employees/${emp.employeeId}`)} title="Xem hồ sơ">{emp.employeeName}</td>
                                                    <td>{emp.positionName}</td>
                                                    <td>
                                                        {(emp.status === 'Approved' && (isAdmin || !isAdmin)) ? (
                                                            <label className="switch-toggle" title={!emp.isActive ? "Bấm để áp dụng" : "Bấm để huỷ áp dụng trợ cấp"}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={emp.isActive}
                                                                    onChange={() => openActionModal(emp, 'toggle', false)}
                                                                />
                                                                <span className="slider round"></span>
                                                            </label>
                                                        ) : (
                                                            <span style={{ color: emp.isActive ? '#0ca678' : '#e03131', fontWeight: 600, fontSize: '13px' }}>
                                                                {emp.isActive ? 'Đang áp dụng' : 'Đã tắt'}
                                                            </span>
                                                        )}
                                                        {' - '}
                                                        <span style={{ fontSize: '12px', color: '#868e96' }}>{getStatusLabel(emp.status)}</span>
                                                    </td>
                                                    {canAction && (
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                {emp.status === 'Pending' && (
                                                                    <>
                                                                        <button className="btn-view-details" style={{ padding: '4px 8px', fontSize: '12px', background: '#d4edda', color: '#155724', borderColor: '#c3e6cb' }} onClick={() => openActionModal(emp, 'approve', false)}>Duyệt</button>
                                                                        <button className="btn-view-details" style={{ padding: '4px 8px', fontSize: '12px', background: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' }} onClick={() => openActionModal(emp, 'reject', false)}>Từ chối</button>
                                                                    </>
                                                                )}
                                                                {emp.status !== 'Rejected' && (
                                                                    <button className="btn-view-details" style={{ padding: '4px 8px', fontSize: '12px', background: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }} onClick={() => openEditModal({ ...emp, bonusName: employeeModal.bonusName, endDate: employeeModal.endDate }, false)}>Sửa</button>
                                                                )}
                                                                {emp.status === 'Rejected' && (
                                                                    <button className="btn-view-details" style={{ padding: '4px 8px', fontSize: '12px', background: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' }} onClick={() => openActionModal(emp, 'delete', false)}>Xoá</button>
                                                                )}
                                                                <button className="btn-view-details" style={{ padding: '4px 8px', fontSize: '12px', background: '#e8f4fd', color: '#1c7ed6', borderColor: '#bee5eb' }} onClick={() => fetchBonusHistory(emp)}>Lịch sử</button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#868e96' }}>Không có nhân viên trong nhóm này.</p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn-default" onClick={() => setEmployeeModal({ ...employeeModal, isOpen: false })}>Đóng</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default BonusList;
