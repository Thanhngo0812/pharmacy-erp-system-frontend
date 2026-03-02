import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import Dashboard from "./Components/PagesAdmin/Dashboard";
import Product from "./Components/PagesAdmin/Product";
import User from "./Components/PagesAdmin/User";
import Account from "./Components/PagesAdmin/Account";
import Profile from "./Components/PagesAdmin/Profile";
import Salary from "./Components/PagesAdmin/Salary";
import Login from "./pages/Login";
import { AuthProvider } from "./store/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import UserProfile from "./pages/User/UserProfile/UserProfile";
import EmployeeList from "./pages/HR/Employees/EmployeeList";
import EmployeeCreate from "./pages/HR/Employees/EmployeeCreate";
import EmployeeDetail from "./pages/HR/Employees/EmployeeDetail";
import EmployeeEdit from "./pages/HR/Employees/EmployeeEdit";
import PositionList from "./pages/HR/Positions/PositionList";
import ProfileEdit from "./pages/User/ProfileEdit/ProfileEdit";
import MyLeaveRequests from "./pages/User/LeaveRequests/MyLeaveRequests";
import ApproveLeaveRequests from "./pages/HR/LeaveRequests/ApproveLeaveRequests";
import SalaryList from "./pages/HR/Salary/SalaryList";
import BonusList from "./pages/HR/Bonuses/BonusList";
import IncomeManagement from "./pages/HR/Income/IncomeManagement";
import MySalary from "./pages/User/MySalary/MySalary";

function App() {
  return (
    <AuthProvider >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <ProtectedRoute roles={[]}>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile/edit"
              element={
                <ProtectedRoute roles={[]}>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
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
              path="employees"
              element={
                <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route path="employees/create" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <EmployeeCreate />
            </ProtectedRoute>} />
            <Route path="employees/:id" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <EmployeeDetail />
            </ProtectedRoute>} />
            <Route path="employees/:id/edit" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <EmployeeEdit />
            </ProtectedRoute>} />
            <Route path="positions" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <PositionList />
            </ProtectedRoute>} />
            <Route
              path="my-leave-requests"
              element={
                <ProtectedRoute roles={[]}>
                  <MyLeaveRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-salary"
              element={
                <ProtectedRoute roles={[]}>
                  <MySalary />
                </ProtectedRoute>
              }
            />
            <Route path="employees/income" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <IncomeManagement />
            </ProtectedRoute>} />
            <Route path="employees/salary-fund" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <SalaryList />
            </ProtectedRoute>} />
            <Route path="employees/leave-approvals" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <ApproveLeaveRequests />
            </ProtectedRoute>} />
            <Route path="employees/bonuses" element={<ProtectedRoute roles={["ROLE_ADMIN", "ROLE_HM"]}>
              <BonusList />
            </ProtectedRoute>} />
            <Route
              path="account"
              element={
                <ProtectedRoute roles={["ROLE_ADMIN"]}>
                  <Account />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light" // Hoặc "colored" nếu bạn thích thông báo có màu nền đậm
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
