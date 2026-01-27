import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./Components/Admin/AdminLayout";
import Dashboard from "./Components/PagesAdmin/Dashboard";
import Product from "./Components/PagesAdmin/Product";
import User from "./Components/PagesAdmin/User";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="product" element={<Product />} />
          <Route path="user" element={<User />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
