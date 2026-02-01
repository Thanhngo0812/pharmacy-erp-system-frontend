import { useContext } from "react";
import { AuthContext } from "../store/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
  const { user, checkValidToken, loading } = useContext(AuthContext);
  if (!checkValidToken()) {
    return <Navigate to="/login" replace />;
  }
  if (loading) return null;
  if (!user.roles.some((item) => roles.includes(item))) {
    // alert("Ban khong co quyen truy cap trang nay!");
    return <Navigate to="/admin" replace />;
  }

  return children;
}
