import { useState } from "react";
import { AuthService } from "../../../services/AuthService";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import { toast } from "react-toastify";
import "./MySalary.scss";

const MySalary = () => {
    const now = new Date();
    const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // tháng trước
    const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const [month, setMonth] = useState(defaultMonth);
    const [year, setYear] = useState(defaultYear);
    const [salaryData, setSalaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    // Kiểm tra tháng chưa kết thúc hoặc tương lai
    const isFutureOrCurrentMonth = (year > now.getFullYear()) || (year === now.getFullYear() && month >= now.getMonth() + 1);

    const formatCurrency = (value) => {
        if (value == null) return "---";
        return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + " đ";
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setSalaryData(null);
        setSearched(true);
        try {
            const response = await AuthService.getMySalary(month, year);
            if (response && response.data) {
                setSalaryData(response.data);
            } else {
                setError("Không có dữ liệu lương cho tháng này.");
            }
        } catch (err) {
            if (err.response?.status === 400) {
                setError("Tháng hoặc năm không hợp lệ.");
            } else if (err.response?.status === 404) {
                setError("Không tìm thấy thông tin lương. Có thể bạn chưa có bản ghi lương trong tháng này.");
            } else {
                setError("Không thể tra cứu lương. Vui lòng thử lại.");
                toast.error("Lỗi khi tra cứu lương.");
            }
        } finally {
            setLoading(false);
        }
    };

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const currentYear = now.getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    return (
        <div className="my-salary-container">
            <div className="salary-card">
                <div className="card-header">
                    <h2>💰 Tra cứu lương cá nhân</h2>
                    <p>Xem chi tiết bảng lương theo tháng</p>
                </div>

                <div className="filter-section">
                    <label>Tháng:</label>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                        {months.map(m => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                    <label>Năm:</label>
                    <select value={year} onChange={e => setYear(Number(e.target.value))}>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button className="btn-search" onClick={handleSearch} disabled={loading || isFutureOrCurrentMonth}>
                        {loading ? "Đang tải..." : "Tra cứu"}
                    </button>
                    {isFutureOrCurrentMonth && (
                        <span style={{ color: '#e03131', fontSize: '13px', fontWeight: 500 }}>
                            ⚠ Chỉ tra cứu được các tháng đã kết thúc
                        </span>
                    )}
                </div>

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                        <LoadingSpinnerMini fullScreen={false} />
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && salaryData && (
                    <div className="salary-content">
                        <div className="employee-info">
                            <h3>{salaryData.fullName}</h3>
                            <span className="position">{salaryData.positionName}</span>
                        </div>

                        <div className="salary-section">
                            <div className="section-title">Thông tin cơ bản</div>
                            <div className="salary-row">
                                <span className="label">Kỳ lương</span>
                                <span className="value highlight">Tháng {salaryData.month}/{salaryData.year}</span>
                            </div>
                            <div className="salary-row">
                                <span className="label">Lương cơ bản</span>
                                <span className="value">{formatCurrency(salaryData.baseSalary)}</span>
                            </div>
                        </div>

                        <div className="salary-section">
                            <div className="section-title">Khấu trừ</div>
                            <div className="salary-row">
                                <span className="label">Ngày nghỉ không lương</span>
                                <span className="value">{salaryData.unpaidLeaveDays ?? 0} ngày</span>
                            </div>
                            <div className="salary-row">
                                <span className="label">Tiền khấu trừ nghỉ phép</span>
                                <span className="value negative">
                                    {salaryData.leaveDeduction > 0 ? "-" : ""}{formatCurrency(salaryData.leaveDeduction)}
                                </span>
                            </div>
                        </div>

                        <div className="salary-section">
                            <div className="section-title">Trợ cấp / Phụ cấp</div>
                            {salaryData.bonuses && salaryData.bonuses.length > 0 ? (
                                <div className="bonus-list">
                                    {salaryData.bonuses.map((b, idx) => (
                                        <div key={idx} className="bonus-item">
                                            <span className="bonus-name">{b.bonusName}</span>
                                            <span className={`bonus-amount ${b.amount >= 0 ? 'positive' : 'negative'}`}>
                                                {b.amount >= 0 ? "+" : ""}{formatCurrency(b.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bonus-list">
                                    <div className="no-bonus">Không có khoản trợ cấp nào trong tháng này.</div>
                                </div>
                            )}
                            <div className="salary-row" style={{ marginTop: '8px' }}>
                                <span className="label">Tổng trợ cấp</span>
                                <span className={`value ${(salaryData.totalBonus ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                                    {(salaryData.totalBonus ?? 0) >= 0 ? "+" : ""}{formatCurrency(salaryData.totalBonus)}
                                </span>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <div className="total-section">
                            <div className="total-row">
                                <span className="total-label">LƯƠNG THỰC NHẬN</span>
                                <span className="total-value">{formatCurrency(salaryData.totalSalary)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && !salaryData && searched && (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>Chưa có dữ liệu</h3>
                        <p>Không tìm thấy bảng lương cho kỳ này.</p>
                    </div>
                )}

                {!searched && !loading && (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>Chọn tháng và năm</h3>
                        <p>Vui lòng chọn kỳ lương và nhấn "Tra cứu" để xem bảng lương.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MySalary;
