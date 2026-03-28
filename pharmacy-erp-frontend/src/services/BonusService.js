import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const BonusService = {
  getBonuses: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/bonuses`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách khoản thưởng:", error);
      throw error;
    }
  },

  approveRejectBonus: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}api/v1/hr/bonuses/${id}/action`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt/từ chối trợ cấp:", error);
      throw error;
    }
  },

  bulkApproveRejectBonus: async (data) => {
    try {
      const response = await axios.put(`${API_URL}api/v1/hr/bonuses/bulk/action`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt/từ chối trợ cấp hàng loạt:", error);
      throw error;
    }
  },

  updateBonus: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}api/v1/hr/bonuses/${id}`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật trợ cấp:", error);
      throw error;
    }
  },

  bulkUpdateBonus: async (data) => {
    try {
      const response = await axios.put(`${API_URL}api/v1/hr/bonuses/bulk`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật trợ cấp hàng loạt:", error);
      throw error;
    }
  },

  deleteBonuses: async (ids) => {
    try {
      const response = await axios.delete(`${API_URL}api/v1/hr/bonuses/bulk`, {
        headers: getAuthHeader(),
        params: { ids: ids.join(",") },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi xoá danh sách trợ cấp:", error);
      throw error;
    }
  },

  createBonus: async (data) => {
    try {
      const response = await axios.post(`${API_URL}api/v1/hr/bonuses`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo trợ cấp mới:", error);
      throw error;
    }
  },

  getEligibleEmployees: async (params) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/bonuses/eligible-employees`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách nhân viên thỏa điều kiện:", error);
      throw error;
    }
  },

  toggleActiveBonus: async (data) => {
    try {
      const response = await axios.put(`${API_URL}api/v1/hr/bonuses/bulk/toggle-active`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi bật/tắt trạng thái trợ cấp:", error);
      throw error;
    }
  },

  getBonusToggleHistory: async (id) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/bonuses/${id}/history`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy lịch sử bật/tắt:", error);
      throw error;
    }
  },
};
