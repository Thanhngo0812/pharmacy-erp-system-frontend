import { useState, useContext } from "react";
import { AuthContext } from "../../../store/AuthContext";
import SalaryList from "../Salary/SalaryList";
import BonusList from "../Bonuses/BonusList";
import MonthlyPayroll from "../Payroll/MonthlyPayroll";
import PayrollSummary from "../Payroll/PayrollSummary";
import PayrollConfigManagement from "../Payroll/PayrollConfigManagement";
import "./IncomeManagement.scss";

const IncomeManagement = () => {
    const [activeTab, setActiveTab] = useState("salary");
    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes("ROLE_ADMIN");

    return (
        <div className="income-management-container">
            <div className="page-header">
                <h2 className="page-title">Quản lý lương</h2>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-item ${activeTab === "salary" ? "active" : ""}`}
                    onClick={() => setActiveTab("salary")}
                >
                    <i className="bi bi-wallet2" style={{ marginRight: '6px' }}></i> Quỹ lương và biến động
                </button>
                <button
                    className={`tab-item ${activeTab === "bonus" ? "active" : ""}`}
                    onClick={() => setActiveTab("bonus")}
                >
                    <i className="bi bi-gift" style={{ marginRight: '6px' }}></i> Thưởng và khấu trừ
                </button>
                <button
                    className={`tab-item ${activeTab === "payroll" ? "active" : ""}`}
                    onClick={() => setActiveTab("payroll")}
                >
                    <i className="bi bi-calendar3" style={{ marginRight: '6px' }}></i> Bảng lương tháng
                </button>
                <button
                    className={`tab-item ${activeTab === "payroll-config" ? "active" : ""}`}
                    onClick={() => setActiveTab("payroll-config")}
                >
                    <i className="bi bi-sliders" style={{ marginRight: '6px' }}></i> Payroll Config
                </button>
                {isAdmin && (
                    <button
                        className={`tab-item ${activeTab === "summary" ? "active" : ""}`}
                        onClick={() => setActiveTab("summary")}
                    >
                        <i className="bi bi-graph-up" style={{ marginRight: '6px' }}></i> Thống kê quỹ lương
                    </button>
                )}
            </div>

            <div className="tab-content">
                {activeTab === "salary" && <SalaryList embedded />}
                {activeTab === "bonus" && <BonusList embedded />}
                {activeTab === "payroll" && <MonthlyPayroll embedded />}
                {activeTab === "payroll-config" && <PayrollConfigManagement embedded />}
                {activeTab === "summary" && isAdmin && <PayrollSummary embedded />}
            </div>
        </div>
    );
};

export default IncomeManagement;
