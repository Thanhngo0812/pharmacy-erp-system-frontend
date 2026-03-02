import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../store/AuthContext';
import { AuthService } from '../../../services/AuthService';
import { toast } from 'react-toastify';
import LoadingSpinnerMini from '../../../components/LoadingSpinner/LoadingSpinnerMini';
import './MonthlyPayroll.scss'; // Dùng chung CSS với MonthlyPayroll

const PayrollSummary = ({ embedded = false }) => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let defaultToMonth = currentMonth - 1;
    let defaultToYear = currentYear;
    if (defaultToMonth === 0) {
        defaultToMonth = 12;
        defaultToYear -= 1;
    }

    // Filters form state
    const [fromMonth, setFromMonth] = useState(1);
    const [fromYear, setFromYear] = useState(defaultToYear);
    const [toMonth, setToMonth] = useState(defaultToMonth);
    const [toYear, setToYear] = useState(defaultToYear);

    const fetchSummary = async () => {
        if (!isAdmin) return;

        if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
            toast.warning("Kỳ bắt đầu không được lớn hơn kỳ kết thúc!");
            setSummaryData([]);
            return;
        }

        const currentDate = new Date();
        const curYear = currentDate.getFullYear();
        const curMonth = currentDate.getMonth() + 1;

        if (toYear > curYear || (toYear === curYear && toMonth >= curMonth)) {
            toast.warning("Chỉ được thống kê cho các kỳ đã kết thúc!");
            setSummaryData([]);
            return;
        }

        setLoading(true);
        try {
            const params = {
                fromMonth,
                fromYear,
                toMonth,
                toYear
            };
            const res = await AuthService.getPayrollSummary(params);

            // Handle response flexibility
            const responseData = res.data ? res.data : res;

            if (res.status === 'success' || Array.isArray(responseData)) {
                setSummaryData(Array.isArray(responseData) ? responseData : []);
            } else {
                toast.error('Không thể lấy dữ liệu thống kê');
            }
        } catch (error) {
            console.error('Lỗi lấy thống kê quỹ lương:', error);
            toast.error(error.response?.data?.message || 'Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchSummary();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const formatMoney = (amount) => {
        if (!amount && amount !== 0) return '0';
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    if (!isAdmin) {
        return (
            <div className={`monthly-payroll-container ${embedded ? 'embedded' : ''}`}>
                <div className="no-data-card">
                    <h3>Bạn không có quyền xem thống kê này</h3>
                </div>
            </div>
        );
    }

    return (
        <div className={`monthly-payroll-container ${embedded ? 'embedded' : ''}`}>
            {/* Filter Section */}
            <div className="month-picker-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="picker-label">Từ kỳ:</span>
                    <select
                        className="month-select"
                        value={fromMonth}
                        onChange={(e) => setFromMonth(Number(e.target.value))}
                    >
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                        ))}
                    </select>
                    <select
                        className="year-input"
                        value={fromYear}
                        onChange={(e) => setFromYear(Number(e.target.value))}
                    >
                        {[...Array(5)].map((_, i) => {
                            const yearValue = currentYear - 2 + i;
                            return <option key={yearValue} value={yearValue}>{yearValue}</option>
                        })}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="picker-label">Đến kỳ:</span>
                    <select
                        className="month-select"
                        value={toMonth}
                        onChange={(e) => setToMonth(Number(e.target.value))}
                    >
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                        ))}
                    </select>
                    <select
                        className="year-input"
                        value={toYear}
                        onChange={(e) => setToYear(Number(e.target.value))}
                    >
                        {[...Array(5)].map((_, i) => {
                            const yearValue = currentYear - 2 + i;
                            return <option key={yearValue} value={yearValue}>{yearValue}</option>
                        })}
                    </select>
                </div>

                <button className="btn-calculate" onClick={fetchSummary} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <><i className="bi bi-hourglass-split"></i> Đang xử lý...</> : <><i className="bi bi-bar-chart-line"></i> Xem thống kê</>}
                </button>
            </div>

            {/* Content Section */}
            <div className="table-card">
                {loading ? (
                    <div className="loading-wrapper" style={{ padding: '50px 0', textAlign: 'center' }}>
                        <LoadingSpinnerMini fullScreen={false} text="Đang tính lương..." />
                    </div>
                ) : summaryData.length > 0 ? (
                    <div className="table-responsive">
                        <table className="payroll-table">
                            <thead>
                                <tr>
                                    <th>Kỳ lương</th>
                                    <th style={{ textAlign: 'center' }}>Tổng nhân viên</th>
                                    <th>Tổng quỹ lương</th>
                                    <th>Tổng thưởng</th>
                                    <th>Tổng khấu trừ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.map((data, index) => {
                                    const grossBonus = data.totalAllowance || 0;
                                    const grossDeduction = (data.totalDeduction || 0) + Math.abs(data.totalPenalty || 0);

                                    return (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 600, color: '#343a40' }}>
                                                Tháng {data.month}/{data.year}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="leave-days" style={{ background: '#e7f5ff', color: '#1c7ed6' }}>
                                                    {data.totalEmployees}
                                                </span>
                                            </td>
                                            <td className="total-col" style={{ color: '#4093DE' }}>
                                                {formatMoney(data.totalPayroll)} ₫
                                            </td>
                                            <td className="money-col bonus-col">
                                                +{formatMoney(grossBonus)}
                                            </td>
                                            <td className="money-col deduction-col">
                                                -{formatMoney(grossDeduction)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="no-data-card" style={{ padding: '60px 0', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', border: '1px dashed #dee2e6' }}>
                        <div className="empty-icon" style={{ fontSize: '48px', color: '#ced4da', marginBottom: '10px' }}>
                            <i className="bi bi-folder2-open"></i>
                        </div>
                        <p style={{ color: '#868e96', fontSize: '15px', margin: 0 }}>Không có dữ liệu thống kê trong khoảng thời gian này</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayrollSummary;
