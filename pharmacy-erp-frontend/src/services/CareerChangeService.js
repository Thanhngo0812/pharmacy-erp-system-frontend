import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const CareerChangeService = {
  getHiredCareerChanges: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/career-changes/hired`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách hồ sơ tuyển dụng mới:", error);
      throw error;
    }
  },

  approveHiredCareerChange: async (id, isApproved) => {
    try {
      const response = await axios.put(
        `${API_URL}api/v1/career-changes/hired/${id}/action`,
        { isApproved },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Lỗi ${isApproved ? "duyệt" : "từ chối"} hồ sơ:`, error);
      throw error;
    }
  },

  getCareerChanges: async (params) => {
    try {
      const response = await axios.get(`${API_URL}api/career-changes`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách đề xuất biến động:", error);
      throw error;
    }
  },

  getMyCareerChanges: async (params) => {
    try {
      const response = await axios.get(`${API_URL}api/career-changes/me`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách đề xuất của tôi:", error);
      throw error;
    }
  },

  createCareerChange: async (data) => {
    try {
      const response = await axios.post(`${API_URL}api/career-changes`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo đề xuất biến động:", error);
      throw error;
    }
  },

  approveRejectCareerChange: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}api/career-changes/${id}/action`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt/từ chối đề xuất:", error);
      throw error;
    }
  },
};
