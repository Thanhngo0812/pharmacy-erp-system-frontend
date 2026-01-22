# Pharmacy ERP System (Frontend)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

A comprehensive **Enterprise Resource Planning (ERP) system** designed for managing pharmacy chains. This frontend application provides a user-friendly interface for various departments including Administration, Management, HR, Warehouse, and Sales, facilitating seamless store operations and data management.

## 📖 Table of Contents
- [Overview](#overview)
- [Features](#features)
  - [Admin Server](#admin-server)
  - [Manager](#manager)
  - [HR Manager](#hr-manager)
  - [Warehouse Manager](#warehouse-manager)
  - [Warehouse Staff](#warehouse-staff)
  - [Sales Staff](#sales-staff)
  - [Common Features](#common-features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Project Structure](#project-structure)

## 🔎 Overview
The **Pharmacy ERP System** is a web-based application built with **React.js** and **JavaScript**. It serves as a centralized platform to manage the complex workflow of a pharmacy business, ranging from inventory and supplier management to human resources and point-of-sale activities.

## 🚀 Features

### 🛡️ Admin Server
* **Account Management:** Create and manage user accounts for all employees.
* **RBAC (Role-Based Access Control):** Add, edit, and delete permissions/roles.
* **Request Handling:** Process system requests and messages from various departments.
* **System Maintenance:** Database backup and recovery.
* **System Monitoring:** Read and analyze system logs.

### 👔 General Manager
* **Staff Management:** Manage employee records; handle termination/resignation workflows.
* **Approvals:**
    * Approve new hires, salary adjustments, and bonuses proposed by HR.
    * Approve resignation requests from lower-level managers.
* **Supply Chain Monitoring:** View lists of import slips, products, and suppliers.
* **Incident Handling:** Communicate directly with the warehouse department to resolve issues regarding imports/products.
* **Reporting:** View statistical reports and business analytics.

### 👥 HR Manager
* **Staff Operations:** Create staff records, update information, and initiate termination processes (pending Manager approval).
* **Compensation & Benefits:** Propose salary changes, bonuses, or promotions (pending Manager approval).
* **HR Reporting:** Access and view salary reports for managed staff.

### 📦 Warehouse Manager
* **Import Management:** Create and approve import slips.
* **Product Management:** Manage product details, categories, and inventory levels.
* **Supplier Management:** Manage supplier information.
* **Reporting:** View detailed reports on import activities.

### 🚛 Warehouse Staff
* **Import Operations:** Create import slips (submit for manager approval).
* **History:** View personal history of created import slips.
* **Inventory:** Check current stock levels.

### 💊 Sales Staff
* **Point of Sale (POS):** Process sales and generate invoices.
* **History:** View personal sales history and invoices.
* **Lookup:** Check product details and real-time inventory availability.

### 👤 Common Features (All Roles)
* **Profile Management:** View and edit personal information.
* **HR Requests:** Create applications for leave (time off) or resignation.
* **Payroll:** View and print personal payslips/salary statements.

## 🛠 Tech Stack
* **Framework:** React.js
* **Language:** JavaScript (ES6+)
* **Build Tool:** Vite (Recommended) / Create React App
* **Routing:** React Router DOM
* **State Management:** (e.g., Redux Toolkit / Zustand / Context API)
* **HTTP Client:** Axios / Fetch API
* **Styling:** (e.g., Tailwind CSS / Material UI / SCSS)

## ⚡ Installation

To get the frontend running locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Thanhngo0812/pharmacy-erp-system-frontend.git](https://github.com/Thanhngo0812/pharmacy-erp-system-frontend.git)
    cd pharmacy-erp-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your backend API URL:
    ```env
    VITE_API_BASE_URL=http://localhost:8080/api/v1
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    npm start
    ```

5.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the port specified in your console).

## 📂 Project Structure
```text
src/
├── assets/          # Static assets (images, icons)
├── components/      # Reusable UI components
├── layouts/         # Page layouts (Dashboard, Auth, etc.)
├── pages/           # Page views for each route
│   ├── Admin/       # Admin specific pages
│   ├── Manager/     # Manager specific pages
│   ├── HR/          # HR specific pages
│   ├── Warehouse/   # Warehouse specific pages
│   └── Sales/       # Sales specific pages
├── services/        # API service calls (Axios setup)
├── store/           # Global state management
├── utils/           # Helper functions
└── App.jsx          # Main application component
