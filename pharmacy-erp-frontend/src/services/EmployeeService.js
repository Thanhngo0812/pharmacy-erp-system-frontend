import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const EmployeeService = {
  getEmployees: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/employees`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách nhân viên:", error);
      throw error;
    }
  },

  toggleLockAccount: async (id, isLocking) => {
    try {
      const action = isLocking ? "lock" : "unlock";
      const response = await axios.post(
        `${API_URL}api/users/${id}/${action}`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi ${isLocking ? "khóa" : "mở khóa"} tài khoản:`, error);
      throw error;
    }
  },

  getEmployeeDetail: async (id) => {
    try {
      const response = await axios.get(`${API_URL}api/employees/${id}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết nhân viên:", error);
      throw error;
    }
  },

  updateEmployee: async (id, formData) => {
    try {
      const response = await axios.put(`${API_URL}api/employees/${id}`, formData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật nhân viên:", error);
      throw error;
    }
  },

  resignEmployee: async (id, data) => {
    try {
      const response = await axios.post(`${API_URL}api/employees/${id}/resign`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cho nghỉ việc:", error);
      throw error;
    }
  },

  rehireEmployee: async (id, data) => {
    try {
      const response = await axios.post(`${API_URL}api/employees/${id}/rehire`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cho làm lại:", error);
      throw error;
    }
  },

  createEmployee: async (formData) => {
    try {
      const response = await axios.post(`${API_URL}api/employees`, formData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo nhân viên mới:", error);
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}api/employees/${id}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi xóa nhân viên:", error);
      throw error;
    }
  },

  getEmployeeSalary: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/employees/salary`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách lương:", error);
      throw error;
    }
  },

  getEmployeeCareerHistoryById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}api/employees/${id}/career-history`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy lịch sử công tác nhân viên:", error);
      throw error;
    }
  },
};
