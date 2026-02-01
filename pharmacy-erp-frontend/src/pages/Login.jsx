import { useContext, useEffect } from "react";
import { AuthContext } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { login, checkValidToken } = useContext(AuthContext);
  const userData = {
    username: "admin@pharmacy.com",
    password: "123456",
  };
  const handleLogin = async () => {
    const result = await login(userData);
    if (result) {
      navigate("/admin", { replace: true });
    }
  };
  useEffect(() => {
    if (checkValidToken()) {
      navigate("/admin", { replace: true });
    }
  }, [checkValidToken, navigate]);
  return (
    <div>
      Day la trang login <button onClick={handleLogin}>Login</button>
    </div>
  );
}
