import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const ProfileService = {
  getProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}api/users/profile`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.log("Lỗi khi lấy thông tin profile:", error);
      throw error;
    }
  },

  getCareerHistory: async () => {
    try {
      const response = await axios.get(`${API_URL}api/employees/me/career-history`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy lịch sử công tác:", error);
      throw error;
    }
  },

  updateMyProfile: async (formData) => {
    try {
      const response = await axios.put(`${API_URL}api/employees/me`, formData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      throw error;
    }
  },

  getMySalary: async (month, year) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/payroll/my-salary`, {
        params: { month, year },
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tra cứu lương:", error);
      throw error;
    }
  },
};
