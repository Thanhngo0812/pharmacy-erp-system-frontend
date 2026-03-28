import axios from "axios";
import { API_URL } from "../utils/config";
import { getAuthHeader } from "./serviceUtils";

export const LeaveRequestService = {
  createLeaveRequest: async (data) => {
    try {
      const response = await axios.post(`${API_URL}api/v1/hr/leave-requests`, data, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo đơn xin nghỉ phép:", error);
      throw error;
    }
  },

  approveLeaveRequest: async (id, status, approvalReason) => {
    try {
      const response = await axios.put(
        `${API_URL}api/v1/hr/leave-requests/${id}/approve`,
        { status, approvalReason },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt đơn xin nghỉ phép:", error);
      throw error;
    }
  },

  getAllLeaveRequests: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/leave-requests`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn xin nghỉ phép:", error);
      throw error;
    }
  },

  getMyLeaveRequests: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}api/v1/hr/leave-requests/my-requests`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn xin nghỉ phép của tôi:", error);
      throw error;
    }
  },

  deleteLeaveRequest: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}api/v1/hr/leave-requests/${id}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi xóa đơn xin nghỉ phép:", error);
      throw error;
    }
  },
};
