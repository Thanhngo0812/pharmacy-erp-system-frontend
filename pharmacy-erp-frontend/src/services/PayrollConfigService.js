import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const PayrollConfigService = {
  getPayrollConfigs: async () => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll-config`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách payroll config:", error);
      throw error;
    }
  },

  getPayrollConfigById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll-config/${id}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết payroll config:", error);
      throw error;
    }
  },

  updatePayrollConfig: async (id, data, month, year) => {
    try {
      const response = await axios.put(`${API_URL}api/v1/hr/payroll-config/${id}`, data, {
        headers: getAuthHeader(),
        params: { month, year },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật payroll config:", error);
      throw error;
    }
  },

  getPayrollConfigLock: async (month, year) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll-config/locks`, {
        headers: getAuthHeader(),
        params: { month, year },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy trạng thái khóa payroll config:", error);
      throw error;
    }
  },

  upsertPayrollConfigLock: async (data) => {
    try {
      const response = await axios.put(`${API_URL}api/v1/hr/payroll-config/locks`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật khóa payroll config:", error);
      throw error;
    }
  },

  getPayrollConfigVersions: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll-config/versions`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách payroll config version:", error);
      throw error;
    }
  },

  getPayrollConfigVersionEffective: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll-config/versions/effective`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy version effective payroll config:", error);
      throw error;
    }
  },

  getPayrollConfigVersionById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll-config/versions/${id}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết payroll config version:", error);
      throw error;
    }
  },
};
