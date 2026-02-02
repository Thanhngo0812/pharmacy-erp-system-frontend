import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_URL } from '../utils/config'; // Import từ file trên
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
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem("user");
  },
  register: () => {},
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
};
