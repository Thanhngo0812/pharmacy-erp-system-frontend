import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const PayrollService = {
  getMonthlyPayroll: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll/monthly`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy bảng lương tháng:", error);
      throw error;
    }
  },

  getPayrollDetail: async (employeeId, params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll/monthly/${employeeId}`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết lương nhân viên:", error);
      throw error;
    }
  },

  getPayrollSummary: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll/summary`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy thống kê quỹ lương:", error);
      throw error;
    }
  },

  getPayrollMonthlySnapshot: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll/snapshots`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy payroll snapshot theo kỳ:", error);
      throw error;
    }
  },

  exportPayrollCSV: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll/monthly/export`, {
        headers: getAuthHeader(),
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bang_luong_${params.month}_${params.year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { status: "success" };
    } catch (error) {
      console.error("Lỗi xuất bảng lương CSV:", error);
      throw error;
    }
  },

  exportPayrollPDF: async (params) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll/monthly/export/pdf`, {
        headers: getAuthHeader(),
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bang_luong_thang_${params.month}_${params.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Lỗi xuất file PDF bảng lương:", error);
      throw error;
    }
  },
};
