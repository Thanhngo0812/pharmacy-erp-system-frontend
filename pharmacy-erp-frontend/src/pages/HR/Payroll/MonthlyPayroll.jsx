import { useState, useContext, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../store/AuthContext";
import { AuthService } from "../../../services/AuthService";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import { toast } from "react-toastify";
import "./MonthlyPayroll.scss";

const MonthlyPayroll = ({ embedded = false }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes("ROLE_ADMIN");

    const now = new Date();
    let defaultMonth = now.getMonth(); // 0-11, so currentMonth - 1
    let defaultYear = now.getFullYear();
    if (defaultMonth === 0) {
        defaultMonth = 12;
        defaultYear -= 1;
    }
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [payrollData, setPayrollData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState(null);
    const [snapshotInfo, setSnapshotInfo] = useState(null);
    const [error, setError] = useState(null);
    const [detailModal, setDetailModal] = useState({ isOpen: false, data: null, loading: false });

    // Filters
    const [filters, setFilters] = useState({
        name: "",
        status: "",
        sortBy: "id",
        order: "asc",
    });

    const formatMoney = (amount) => {
        if (amount == null) return "0";
        return Number(amount).toLocaleString("vi-VN");
    };

    const getSnapshotMeta = (payload) => {
        if (!payload) return null;

        const summaryMeta = payload.summary || {};
        const rawSnapshot = payload.payrollSnapshot || payload.snapshot || {};

        const versionNo =
            rawSnapshot.versionNo ?? rawSnapshot.snapshotVersion ??
            summaryMeta.versionNo ?? summaryMeta.snapshotVersion ??
            payload.snapshotVersion ?? null;

        const generatedAt =
            rawSnapshot.generatedAt ?? rawSnapshot.createdAt ?? rawSnapshot.snapshotAt ??
            summaryMeta.snapshotAt ?? payload.snapshotAt ?? null;

        const locked =
            rawSnapshot.isLocked ?? rawSnapshot.isFinalized ??
            summaryMeta.isLocked ?? summaryMeta.isFinalized ??
            payload.isLocked ?? null;

        const source =
            rawSnapshot.source ?? rawSnapshot.calculationMode ??
            payload.calculationSource ?? payload.calculationMode ?? null;

        if (versionNo == null && generatedAt == null && locked == null && source == null) {
            return null;
        }

        return { versionNo, generatedAt, locked, source };
    };

    const fetchPayroll = useCallback(async () => {
        const currentDate = new Date();
        const currentYearValue = currentDate.getFullYear();
        const currentMonthValue = currentDate.getMonth() + 1;

        if (selectedYear > currentYearValue || (selectedYear === currentYearValue && selectedMonth >= currentMonthValue)) {
            setPayrollData(null);
            setEmployees([]);
            setSummary(null);
            toast.warning("Chỉ được xem/tính lương cho tháng đã kết thúc!");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const params = {
                month: selectedMonth,
                year: selectedYear,
                ...filters,
            };
            // Remove empty params
            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] == null) delete params[key];
            });

            const res = await AuthService.getMonthlyPayroll(params);
            console.log("Payroll API response:", res);

            // Xử lý linh hoạt: data có thể nằm ở res.data hoặc trực tiếp ở res
            const payroll = res.data || res;
            setPayrollData(payroll);
            setEmployees(payroll.employees || []);
            setSummary(payroll.summary || null);

            const foundSnapshotMeta = getSnapshotMeta(payroll);
            if (foundSnapshotMeta) {
                setSnapshotInfo(foundSnapshotMeta);
            } else {
                try {
                    const snapshotRes = await AuthService.getPayrollMonthlySnapshot({
                        month: selectedMonth,
                        year: selectedYear,
                    });
                    const snapshotPayload = snapshotRes?.data || snapshotRes;
                    setSnapshotInfo(getSnapshotMeta(snapshotPayload));
                } catch (_) {
                    setSnapshotInfo(null);
                }
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Lỗi khi tải bảng lương";
            setError(msg);
            setSnapshotInfo(null);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setFilters({ name: "", status: "", sortBy: "id", order: "asc" });
    };

    // Auto fetch khi filter thay đổi (nếu đã có data)
    useEffect(() => {
        if (payrollData) {
            fetchPayroll();
        }

            {snapshotInfo && (
                <div className="snapshot-banner">
                    <div className="snapshot-title">
                        <i className="bi bi-shield-check"></i> Metadata kỳ lương
                    </div>
                    <div className="snapshot-items">
                        {snapshotInfo.versionNo != null && (
                            <span className="snapshot-chip">Version: {snapshotInfo.versionNo}</span>
                        )}
                        {snapshotInfo.generatedAt && (
                            <span className="snapshot-chip">Snapshot lúc: {new Date(snapshotInfo.generatedAt).toLocaleString("vi-VN")}</span>
                        )}
                        {snapshotInfo.source && (
                            <span className="snapshot-chip">Nguồn tính: {snapshotInfo.source}</span>
                        )}
                        {snapshotInfo.locked != null && (
                            <span className={`snapshot-chip ${snapshotInfo.locked ? "locked" : "open"}`}>
                                {snapshotInfo.locked ? "Đã khóa kỳ" : "Kỳ đang mở"}
                            </span>
                        )}
                    </div>
                </div>
            )}
    }, [filters]);

    const openDetail = async (emp) => {
        setDetailModal({ isOpen: true, data: null, loading: true });
        try {
            const res = await AuthService.getPayrollDetail(emp.employeeId, {
                month: selectedMonth,
                year: selectedYear,
            });
            console.log("Payroll detail response:", res);
            const detail = res.data || res;
            setDetailModal({ isOpen: true, data: detail, loading: false });
        } catch (err) {
            toast.error("Lỗi khi tải chi tiết lương");
            setDetailModal({ isOpen: false, data: null, loading: false });
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await AuthService.exportPayrollCSV({ month: selectedMonth, year: selectedYear });
            toast.success("Đã tải xuống bảng lương CSV!");
        } catch (err) {
            toast.error("Lỗi khi xuất CSV");
        } finally {
            setExporting(false);
        }
    };

    const handleExportPDF = async () => {
        setExportingPDF(true);
        try {
            await AuthService.exportPayrollPDF({ month: selectedMonth, year: selectedYear });
            toast.success("Đã tải xuống bảng lương PDF!");
        } catch (err) {
            toast.error("Lỗi khi xuất PDF");
        } finally {
            setExportingPDF(false);
        }
    };

    const monthNames = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    const isProcessing = loading || exporting || exportingPDF;

    return (
        <div className={`monthly-payroll-container ${embedded ? 'embedded' : ''}`}>
            {isProcessing && !loading && (
                <div className="loading-overlay">
                    <LoadingSpinnerMini
                        fullScreen={false}
                        text="Đang chuẩn bị tệp..."
                    />
                </div>
            )}

            {/* Month Picker */}
            <div className="month-picker-bar">
                <span className="picker-label"><i className="bi bi-calendar3"></i> Chọn kỳ lương:</span>
                <select
                    className="month-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                    {monthNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>{name}</option>
                    ))}
                </select>
                <input
                    type="number"
                    className="year-input"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    min={2000}
                    max={2100}
                />
                <button
                    className="btn-calculate"
                    onClick={fetchPayroll}
                    disabled={isProcessing}
                >
                    <i className="bi bi-calculator"></i> Tính lương
                </button>

                {isAdmin && payrollData && (
                    <>
                        <button
                            className="btn-export-pdf"
                            onClick={handleExportPDF}
                            disabled={isProcessing}
                        >
                            <i className="bi bi-file-earmark-pdf"></i> Xuất PDF
                        </button>
                        <button
                            className="btn-export"
                            onClick={handleExport}
                            disabled={isProcessing}
                        >
                            <i className="bi bi-file-earmark-excel"></i> Xuất CSV
                        </button>
                    </>
                )}
            </div>

            {/* Summary Cards */}
            {summary && (() => {
                const calTotalBonus = summary.totalBonus != null
                    ? summary.totalBonus
                    : (summary.totalAllowance || 0) + (summary.totalPenalty || 0);
                const calTotalDeduction = summary.totalDeduction || 0;
                const calTotalInsurance = summary.totalInsurance || 0;
                const calTotalPit = summary.totalPit || 0;
                const calTotalNetPayroll = summary.totalNetPayroll != null
                    ? summary.totalNetPayroll
                    : (summary.totalPayroll || 0) - calTotalInsurance - calTotalPit;

                return (
                    <div className="summary-cards">
                        <div className="summary-card total-employees">
                            <span className="summary-label">Tổng nhân viên</span>
                            <span className="summary-value">{summary.totalEmployees}</span>
                        </div>
                        <div className="summary-card total-payroll">
                            <span className="summary-label">Tổng Gross nội bộ</span>
                            <span className="summary-value">{formatMoney(summary.totalPayroll)} ₫</span>
                        </div>
                        <div className="summary-card total-bonus">
                            <span className="summary-label">Tổng trợ cấp/thưởng/phạt</span>
                            <span className="summary-value">
                                {calTotalBonus >= 0 ? "+" : ""}{formatMoney(calTotalBonus)} ₫
                            </span>
                        </div>
                        <div className="summary-card total-deduction">
                            <span className="summary-label">Tổng khấu trừ nghỉ phép</span>
                            <span className="summary-value">-{formatMoney(calTotalDeduction)} ₫</span>
                        </div>
                        <div className="summary-card total-deduction">
                            <span className="summary-label">Tổng bảo hiểm</span>
                            <span className="summary-value">-{formatMoney(calTotalInsurance)} ₫</span>
                        </div>
                        <div className="summary-card total-deduction">
                            <span className="summary-label">Tổng PIT</span>
                            <span className="summary-value">-{formatMoney(calTotalPit)} ₫</span>
                        </div>
                        <div className="summary-card total-payroll">
                            <span className="summary-label">Tổng lương thực nhận</span>
                            <span className="summary-value">{formatMoney(calTotalNetPayroll)} ₫</span>
                        </div>
                    </div>
                );
            })()}

            {/* Filter Bar - chỉ hiện khi đã có data */}
            {payrollData && (
                <div className="filter-card">
                    <div className="filter-form">
                        <div className="filter-group">
                            <input
                                type="text"
                                name="name"
                                placeholder="Tìm theo tên..."
                                value={filters.name}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="filter-group">
                            <select name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">-- Tất cả trạng thái --</option>
                                <option value="Active">Đang làm việc</option>
                                <option value="Resigned">Đã nghỉ</option>
                            </select>
                        </div>
                        <div className="filter-group sort-group">
                            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                                <option value="id">Sắp xếp: ID</option>
                                <option value="name">Sắp xếp: Tên</option>
                                <option value="baseSalary">Sắp xếp: Lương CB</option>
                                <option value="totalSalary">Sắp xếp: Gross nội bộ</option>
                            </select>
                            <select name="order" value={filters.order} onChange={handleFilterChange} className="order-select">
                                <option value="asc">Tăng ⬆</option>
                                <option value="desc">Giảm ⬇</option>
                            </select>
                        </div>
                        <button type="button" className="btn-reset" onClick={handleReset}>Đặt lại</button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && <div className="error-message" style={{ background: '#fff5f5', color: '#fa5252', padding: '15px', borderRadius: '8px', border: '1px solid #ffc9c9', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <LoadingSpinnerMini fullScreen={false} text="Đang xử lý dữ liệu..." />
                </div>
            )}

            {/* Table */}
            {!loading && payrollData && (
                <div className="table-card">
                    <div className="table-responsive">
                        <table className="payroll-table">
                            <thead>
                                <tr>
                                    <th>Mã NV</th>
                                    <th>Họ tên</th>
                                    <th>Chức vụ</th>
                                    <th style={{ textAlign: 'right' }}>Lương cơ bản</th>
                                    <th style={{ textAlign: 'center' }}>Nghỉ KL</th>
                                    <th style={{ textAlign: 'right' }}>Khấu trừ nghỉ</th>
                                    <th style={{ textAlign: 'right' }}>Thưởng</th>
                                    <th style={{ textAlign: 'right' }}>Gross nội bộ</th>
                                    <th style={{ textAlign: 'right' }}>BH bắt buộc</th>
                                    <th style={{ textAlign: 'right' }}>PIT</th>
                                    <th style={{ textAlign: 'right' }}>Thực nhận</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length > 0 ? (
                                    employees.map(emp => {
                                        const monthlyBonus = emp.totalBonus != null
                                            ? emp.totalBonus
                                            : (emp.totalAllowance || 0) + (emp.totalPenalty || 0);
                                        const leaveDeduction = emp.leaveDeduction || 0;
                                        const insuranceDeduction = emp.insuranceDeduction || 0;
                                        const pitTax = emp.pitTax || 0;
                                        const grossInternal = emp.totalSalary || 0;
                                        const netSalary = emp.netSalary != null
                                            ? emp.netSalary
                                            : (grossInternal - insuranceDeduction - pitTax);
                                        return (
                                            <tr key={emp.employeeId} onClick={() => openDetail(emp)} title="Nhấn để xem chi tiết">
                                                <td className="id-col">#{emp.employeeId}</td>
                                                <td className="name-col">{emp.fullName}</td>
                                                <td>{emp.positionName}</td>
                                                <td className="money-col">{formatMoney(emp.baseSalary)}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="leave-days">{emp.unpaidLeaveDays || 0}</span>
                                                </td>
                                                <td className="money-col deduction-col">-{formatMoney(leaveDeduction)}</td>
                                                <td className="money-col bonus-col">{monthlyBonus >= 0 ? `+${formatMoney(monthlyBonus)}` : formatMoney(monthlyBonus)}</td>
                                                <td className="money-col">{formatMoney(grossInternal)} ₫</td>
                                                <td className="money-col deduction-col">-{formatMoney(insuranceDeduction)} ₫</td>
                                                <td className="money-col deduction-col">-{formatMoney(pitTax)} ₫</td>
                                                <td className="total-col">{formatMoney(netSalary)} ₫</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="no-data">Không có dữ liệu nhân viên</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !payrollData && !error && (
                <div className="empty-state">
                    <div className="empty-icon"><i className="bi bi-bar-chart"></i></div>
                    <div className="empty-title">Chọn kỳ lương để bắt đầu</div>
                    <div className="empty-desc">Chọn tháng và năm ở trên, sau đó bấm "Tính lương" để xem bảng lương</div>
                </div>
            )}

            {/* Detail Modal */}
            {detailModal.isOpen && (
                <div className="modal-overlay" onClick={() => setDetailModal({ isOpen: false, data: null, loading: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {detailModal.data
                                    ? `Chi tiết lương - ${detailModal.data.fullName}`
                                    : "Đang tải..."}
                            </h3>
                            <button className="btn-close" onClick={() => setDetailModal({ isOpen: false, data: null, loading: false })}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {detailModal.loading && <LoadingSpinnerMini fullScreen={false} text="Đang tải chi tiết..." />}
                            {detailModal.data && (
                                <>
                                    {/* Thông tin cơ bản */}
                                    <div className="detail-section">
                                        <div className="section-title"><i className="bi bi-person-badge"></i> Thông tin nhân viên</div>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="label">Họ tên</span>
                                                <span className="value">{detailModal.data.fullName}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Chức vụ</span>
                                                <span className="value">{detailModal.data.positionName}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Kỳ lương</span>
                                                <span className="value">Tháng {detailModal.data.month}/{detailModal.data.year}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Lương cơ bản</span>
                                                <span className="value money">{formatMoney(detailModal.data.baseSalary)} ₫</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Biến động lương trong tháng */}
                                    {detailModal.data.salaryChanges && detailModal.data.salaryChanges.length > 0 && (
                                        <div className="detail-section">
                                            <div className="section-title"><i className="bi bi-graph-up"></i> Biến động lương trong tháng</div>
                                            <table className="detail-table">
                                                <thead>
                                                    <tr>
                                                        <th>Từ ngày</th>
                                                        <th>Đến ngày</th>
                                                        <th>Mức lương</th>
                                                        <th>Số ngày</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detailModal.data.salaryChanges.map((change, idx) => (
                                                        <tr key={idx}>
                                                            <td>{change.fromDate}</td>
                                                            <td>{change.toDate}</td>
                                                            <td className="money">{formatMoney(change.salary)} ₫</td>
                                                            <td style={{ textAlign: 'center' }}>{change.days}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Khoản theo tháng (trợ cấp/thưởng/phạt) */}
                                    {(() => {
                                        const allBonuses = detailModal.data.bonuses || [];
                                        const totalMonthlyBonus = detailModal.data.totalBonus != null
                                            ? detailModal.data.totalBonus
                                            : ((detailModal.data.totalAllowance || 0) + (detailModal.data.totalPenalty || 0));
                                        const totalDeduction = detailModal.data.totalDeduction != null
                                            ? detailModal.data.totalDeduction
                                            : (detailModal.data.leaveDeduction || 0);

                                        return (
                                            <>
                                                <div className="detail-section">
                                                    <div className="section-title"><i className="bi bi-gift"></i> Khoản theo tháng (trợ cấp/thưởng/phạt)</div>
                                                    {allBonuses.length > 0 ? (
                                                        <table className="detail-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Tên khoản</th>
                                                                    <th style={{ textAlign: 'right' }}>Số tiền</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {allBonuses.map((bonus, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{bonus.bonusName}</td>
                                                                        <td className={`money ${bonus.amount >= 0 ? 'bonus' : 'danger'}`}>
                                                                            {bonus.amount >= 0 ? '+' : ''}{formatMoney(bonus.amount)} ₫
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="no-data-text">Không có khoản trợ cấp/thưởng/phạt theo tháng</p>
                                                    )}
                                                    <div className="info-grid" style={{ marginTop: '10px' }}>
                                                        <div className="info-item">
                                                            <span className="label">Tổng khoản theo tháng</span>
                                                            <span className={`value money ${totalMonthlyBonus >= 0 ? 'bonus' : 'danger'}`}>
                                                                {totalMonthlyBonus >= 0 ? '+' : ''}{formatMoney(totalMonthlyBonus)} ₫
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Khấu trừ */}
                                                <div className="detail-section">
                                                    <div className="section-title"><i className="bi bi-dash-circle"></i> Khấu trừ</div>

                                                    {detailModal.data.leaveDetails && detailModal.data.leaveDetails.length > 0 && (
                                                        <>
                                                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#868e96', marginBottom: '6px' }}>Nghỉ phép không lương</p>
                                                            <table className="detail-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Từ ngày</th>
                                                                        <th>Đến ngày</th>
                                                                        <th>Số ngày</th>
                                                                        <th>Loại</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {detailModal.data.leaveDetails.map((leave, idx) => (
                                                                        <tr key={idx}>
                                                                            <td>{leave.startDate}</td>
                                                                            <td>{leave.endDate}</td>
                                                                            <td style={{ textAlign: 'center' }}>{leave.days}</td>
                                                                            <td>{leave.type === 'Approved_Salary' ? <span className="text-success"><i className="bi bi-check-circle-fill"></i> Có lương</span> : <span className="text-danger"><i className="bi bi-x-circle-fill"></i> Không lương</span>}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </>
                                                    )}

                                                    {!detailModal.data.leaveDetails?.length && !totalDeduction && (
                                                        <p className="no-data-text">Không có khoản khấu trừ</p>
                                                    )}

                                                    <div className="info-grid" style={{ marginTop: '10px' }}>
                                                        <div className="info-item">
                                                            <span className="label">Nghỉ KL: {detailModal.data.unpaidLeaveDays || 0} ngày</span>
                                                            <span className="value money danger">-{formatMoney(detailModal.data.leaveDeduction || 0)} ₫</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">Tổng khấu trừ</span>
                                                            <span className="value money danger">-{formatMoney(totalDeduction)} ₫</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="detail-section">
                                                    <div className="section-title"><i className="bi bi-calculator"></i> Bảo hiểm và thuế</div>
                                                    <div className="info-grid">
                                                        <div className="info-item">
                                                            <span className="label">Gross nội bộ</span>
                                                            <span className="value money">{formatMoney(detailModal.data.totalSalary || 0)} ₫</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">Bảo hiểm bắt buộc</span>
                                                            <span className="value money danger">-{formatMoney(detailModal.data.insuranceDeduction || 0)} ₫</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">Thuế TNCN (PIT)</span>
                                                            <span className="value money danger">-{formatMoney(detailModal.data.pitTax || 0)} ₫</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">Lương thực nhận</span>
                                                            <span className="value money bonus">
                                                                {formatMoney(
                                                                    detailModal.data.netSalary != null
                                                                        ? detailModal.data.netSalary
                                                                        : ((detailModal.data.totalSalary || 0)
                                                                            - (detailModal.data.insuranceDeduction || 0)
                                                                            - (detailModal.data.pitTax || 0))
                                                                )} ₫
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* Tổng kết */}
                                    <div className="total-bar">
                                        <span className="total-label"><i className="bi bi-wallet2"></i> LƯƠNG THỰC NHẬN</span>
                                        <span className="total-value">
                                            {formatMoney(
                                                detailModal.data.netSalary != null
                                                    ? detailModal.data.netSalary
                                                    : ((detailModal.data.totalSalary || 0)
                                                        - (detailModal.data.insuranceDeduction || 0)
                                                        - (detailModal.data.pitTax || 0))
                                            )} ₫
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-close-modal" onClick={() => setDetailModal({ isOpen: false, data: null, loading: false })}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyPayroll;
