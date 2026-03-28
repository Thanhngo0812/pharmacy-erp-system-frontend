import axios from "axios";
import { API_URL } from "../utils/config";

const getStoredToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.accessToken || null;
  } catch (error) {
    return null;
  }
};

export const UnitService = {
  getUnits: async () => {
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Chưa đăng nhập");

      const response = await axios.get(`${API_URL}api/units`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn vị:", error);
      throw error;
    }
  },

  createUnit: async (data) => {
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Chưa đăng nhập");

      const response = await axios.post(`${API_URL}api/units`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo đơn vị:", error);
      throw error;
    }
  },

  updateUnit: async (id, data) => {
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Chưa đăng nhập");

      const response = await axios.put(`${API_URL}api/units/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật đơn vị:", error);
      throw error;
    }
  },

  deleteUnit: async (id) => {
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Chưa đăng nhập");

      const response = await axios.delete(`${API_URL}api/units/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi xóa đơn vị:", error);
      throw error;
    }
  },
};
