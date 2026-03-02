import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import '@fontsource/be-vietnam-pro/300.css'; // Light (cho text phụ)
import '@fontsource/be-vietnam-pro/400.css'; // Regular (text chính)
import '@fontsource/be-vietnam-pro/500.css'; // Medium (menu, tiêu đề bảng)
import '@fontsource/be-vietnam-pro/600.css'; // Semi-bold (tiêu đề quan trọng)
import '@fontsource/be-vietnam-pro/700.css'; // Bold (số liệu tổng, header lớn)
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
