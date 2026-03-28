import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const PositionService = {
  getPositions: async () => {
    try {
      const response = await axios.get(`${API_URL}api/positions`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách chức vụ:", error);
      throw error;
    }
  },

  getAllPositions: async () => {
    try {
      const response = await axios.get(`${API_URL}api/positions/all`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy tất cả chức vụ:", error);
      throw error;
    }
  },

  searchPositionsApi: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/positions/search`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tìm kiếm chức vụ:", error);
      throw error;
    }
  },

  createPositionApi: async (data) => {
    try {
      const response = await axios.post(`${API_URL}api/positions`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo chức vụ:", error);
      throw error;
    }
  },

  updatePositionStatusApi: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}api/positions/${id}/status`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi thay đổi trạng thái chức vụ:", error);
      throw error;
    }
  },

  updatePositionNameApi: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}api/positions/${id}`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật tên chức vụ:", error);
      throw error;
    }
  },

  deletePositionApi: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}api/positions/${id}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi xóa chức vụ:", error);
      throw error;
    }
  },
};
