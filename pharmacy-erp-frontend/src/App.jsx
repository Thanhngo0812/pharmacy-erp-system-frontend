import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./Components/Admin/AdminLayout";
import Dashboard from "./Components/PagesAdmin/Dashboard";
import Product from "./Components/PagesAdmin/Product";
import User from "./Components/PagesAdmin/User";
import Account from "./Components/PagesAdmin/Account";
import Profile from "./Components/PagesAdmin/Profile";
import Salary from "./Components/PagesAdmin/Salary";
import Login from "./pages/Login";
import { AuthProvider } from "./store/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PageNotFound from "./pages/PageNotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <ProtectedRoute roles={["ROLE_ADMIN"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="product"
              element={
                <ProtectedRoute roles={["ROLE_ADMIN"]}>
                  <Product />
                </ProtectedRoute>
              }
            />
            <Route
              path="user"
              element={
                <ProtectedRoute roles={["ROLE_ADMIN"]}>
                  <User />
                </ProtectedRoute>
              }
            />
            <Route
              path="account"
              element={
                <ProtectedRoute roles={["ROLE_ADMIN"]}>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute roles={["ROLE_WM"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="salary"
              element={
                <ProtectedRoute roles={["ROLE_SS"]}>
                  <Salary />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
