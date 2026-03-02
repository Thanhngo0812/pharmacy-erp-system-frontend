import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_URL } from '../utils/config'; // Import từ file trên
import { useContext } from "react";
import { AuthContext } from "../store/AuthContext";
// Hàm helper nội bộ để lấy token từ localStorage (không dùng Hook)
const getStoredToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.accessToken || null;
  } catch (error) {
    return null;
  }
};
export const AuthService = {
  login: async (userdata) => {
    try {
      const response = await axios.post(
        `${API_URL}api/auth/login`,
        userdata,
      );
      if (response) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
        return response.data.data;
      }
    } catch (error) {
      console.log("Co loi khi dang nhap: ", error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem("user");
  },
  register: () => { },
  checkValidToken: () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.accessToken) return false;
      const decodeToken = jwtDecode(user.accessToken);
      if (decodeToken.exp < Date.now() / 1000) {
        return false;
      }
      // console.log("token valid: ", decodeToken);
      return true;
    } catch (error) {
      console.log("token invalid", error);
      return false;
    }
  },

  getProfile: async () => {
    try {
      const token = getStoredToken();
      // 2. Gọi API kèm Header Authorization
      const response = await axios.get(`${API_URL}api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`, // Quan trọng: Gửi token lên server
        },
      });

      // 3. Trả về data
      return response.data;
    } catch (error) {
      console.log("Lỗi khi lấy thông tin profile:", error);
      // Ném lỗi ra để bên Component xử lý (ví dụ: đá về trang login)
      throw error;
    }
  },
  getEmployees: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      // Axios sẽ tự động chuyển object params thành query string
      // Ví dụ: /api/employees?name=An&sortBy=salary&order=desc
      const response = await axios.get(`${API_URL}api/employees`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách nhân viên:", error);
      throw error;
    }
  },
  toggleLockAccount: async (id, isLocking) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      // Nếu isLocking = true -> Gọi API lock
      // Nếu isLocking = false -> Gọi API unlock
      const action = isLocking ? "lock" : "unlock";

      // Đường dẫn sẽ là: /api/employees/5/lock hoặc /api/employees/5/unlock
      // (LƯU Ý: Bạn kiểm tra lại Controller Java xem @RequestMapping đầu file là /api/employees hay /api/users nhé)
      const url = `${API_URL}api/users/${id}/${action}`;

      const response = await axios.post(
        url,
        {}, // Body rỗng vì API của bạn không cần body
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi ${isLocking ? 'khóa' : 'mở khóa'} tài khoản:`, error);
      throw error;
    }
  },
  getCareerHistory: async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/employees/me/career-history`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy lịch sử công tác:", error);
      throw error; // Ném lỗi để component xử lý
    }
  },
  getEmployeeDetail: async (id) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/employees/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết nhân viên:", error);
      throw error; // Ném lỗi để Component xử lý (403, 404)
    }
  },
  updateMyProfile: async (formData) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      // Endpoint: /api/employees/me (API số 5 trong tài liệu)
      const response = await axios.put(
        `${API_URL}api/employees/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data"
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      throw error;
    }
  },
  updateEmployee: async (id, formData) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/employees/${id}`,
        formData, // Truyền trực tiếp đối tượng FormData vào đây
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data" // Bắt buộc cho upload file
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật nhân viên:", error);
      throw error;
    }
  },
  resignEmployee: async (id, data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.post(
        `${API_URL}api/employees/${id}/resign`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi cho nghỉ việc:", error);
      throw error;
    }
  },
  rehireEmployee: async (id, data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.post(
        `${API_URL}api/employees/${id}/rehire`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi cho làm lại:", error);
      throw error;
    }
  },
  createEmployee: async (formData) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      // Endpoint: /api/employees (POST)
      const response = await axios.post(
        `${API_URL}api/employees`,
        formData, // Truyền trực tiếp đối tượng FormData vào đây
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data" // Bắt buộc cho upload file
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo nhân viên mới:", error);
      throw error;
    }
  },
  deleteEmployee: async (id) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.delete(
        `${API_URL}api/employees/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi xóa nhân viên:", error);
      throw error;
    }
  },
  getPositions: async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/positions`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách chức vụ:", error);
      throw error;
    }
  },
  getAllPositions: async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/positions/all`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy tất cả chức vụ:", error);
      throw error;
    }
  },
  searchPositionsApi: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/positions/search`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi tìm kiếm chức vụ:", error);
      throw error;
    }
  },
  createPositionApi: async (data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.post(
        `${API_URL}api/positions`,
        data,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo chức vụ:", error);
      throw error;
    }
  },
  updatePositionStatusApi: async (id, data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/positions/${id}/status`,
        data,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi thay đổi trạng thái chức vụ:", error);
      throw error;
    }
  },
  updatePositionNameApi: async (id, data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/positions/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật tên chức vụ:", error);
      throw error;
    }
  },
  deletePositionApi: async (id) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.delete(
        `${API_URL}api/positions/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi xóa chức vụ:", error);
      throw error;
    }
  },

  // --- LEAVE REQUEST APIs ---
  createLeaveRequest: async (data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.post(
        `${API_URL}api/v1/hr/leave-requests`,
        data,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo đơn xin nghỉ phép:", error);
      throw error;
    }
  },

  approveLeaveRequest: async (id, status, approvalReason) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/v1/hr/leave-requests/${id}/approve`,
        { status, approvalReason },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt đơn xin nghỉ phép:", error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}api/v1/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error("Lỗi gửi yêu cầu reset password:", error);
      throw error;
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}api/v1/auth/reset-password`, {
        email,
        otp,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi đổi mật khẩu bằng OTP:", error);
      throw error;
    }
  },

  getAllLeaveRequests: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/leave-requests`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn xin nghỉ phép:", error);
      throw error;
    }
  },

  getMyLeaveRequests: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/leave-requests/my-requests`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn xin nghỉ phép của tôi:", error);
      throw error;
    }
  },

  deleteLeaveRequest: async (id) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.delete(
        `${API_URL}api/v1/hr/leave-requests/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi xóa đơn xin nghỉ phép:", error);
      throw error;
    }
  },

  // --- HIRED CAREER CHANGES APIs ---
  getHiredCareerChanges: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/career-changes/hired`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách hồ sơ tuyển dụng mới:", error);
      throw error;
    }
  },

  approveHiredCareerChange: async (id, isApproved) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/v1/career-changes/hired/${id}/action`,
        { isApproved },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Lỗi ${isApproved ? 'duyệt' : 'từ chối'} hồ sơ:`, error);
      throw error;
    }
  },

  // --- SALARY APIs ---
  getEmployeeSalary: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/employees/salary`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách lương:", error);
      throw error;
    }
  },

  getEmployeeCareerHistoryById: async (id) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/employees/${id}/career-history`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy lịch sử công tác nhân viên:", error);
      throw error;
    }
  },

  // --- CAREER CHANGE APIs ---
  getCareerChanges: async (params) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(`${API_URL}api/career-changes`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(`${API_URL}api/career-changes/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.post(`${API_URL}api/career-changes`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo đề xuất biến động:", error);
      throw error;
    }
  },

  approveRejectCareerChange: async (id, data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/career-changes/${id}/action`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt/từ chối đề xuất:", error);
      throw error;
    }
  },

  // --- BONUS APIs ---
  getBonuses: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/bonuses`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách khoản thưởng:", error);
      throw error;
    }
  },

  approveRejectBonus: async (id, data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/v1/hr/bonuses/${id}/action`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt/từ chối trợ cấp:", error);
      throw error;
    }
  },

  bulkApproveRejectBonus: async (data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/v1/hr/bonuses/bulk/action`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi duyệt/từ chối trợ cấp hàng loạt:", error);
      throw error;
    }
  },

  updateBonus: async (id, data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/v1/hr/bonuses/${id}`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật trợ cấp:", error);
      throw error;
    }
  },

  bulkUpdateBonus: async (data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/v1/hr/bonuses/bulk`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi cập nhật trợ cấp hàng loạt:", error);
      throw error;
    }
  },

  deleteBonuses: async (ids) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.delete(
        `${API_URL}api/v1/hr/bonuses/bulk`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { ids: ids.join(',') }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi xoá danh sách trợ cấp:", error);
      throw error;
    }
  },

  createBonus: async (data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.post(
        `${API_URL}api/v1/hr/bonuses`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi tạo trợ cấp mới:", error);
      throw error;
    }
  },

  getEligibleEmployees: async (params) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/bonuses/eligible-employees`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách nhân viên thỏa điều kiện:", error);
      throw error;
    }
  },

  toggleActiveBonus: async (data) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.put(
        `${API_URL}api/v1/hr/bonuses/bulk/toggle-active`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi bật/tắt trạng thái trợ cấp:", error);
      throw error;
    }
  },

  getBonusToggleHistory: async (id) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/bonuses/${id}/history`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy lịch sử bật/tắt:", error);
      throw error;
    }
  },

  getMySalary: async (month, year) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/payroll/my-salary`,
        {
          params: { month, year },
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi tra cứu lương:", error);
      throw error;
    }
  },

  // --- PAYROLL APIs ---
  getMonthlyPayroll: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/payroll/monthly`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy bảng lương tháng:", error);
      throw error;
    }
  },

  getPayrollDetail: async (employeeId, params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/payroll/monthly/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết lương nhân viên:", error);
      throw error;
    }
  },

  getPayrollSummary: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/payroll/summary`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy thống kê quỹ lương:", error);
      throw error;
    }
  },

  exportPayrollCSV: async (params = {}) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/payroll/monthly/export`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params,
          responseType: 'blob',
        }
      );
      // Tạo link download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bang_luong_${params.month}_${params.year}.csv`);
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
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Chưa đăng nhập");
      const { accessToken } = JSON.parse(userStr);

      const response = await axios.get(
        `${API_URL}api/v1/hr/payroll/monthly/export/pdf`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params,
          responseType: 'blob' // Quan trọng cho file download
        }
      );
      // Tạo url ẩn để tự động download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bang_luong_thang_${params.month}_${params.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Lỗi xuất file PDF bảng lương:", error);
      throw error;
    }
  },
};
