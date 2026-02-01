import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const AuthService = {
  login: async (userdata) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
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
