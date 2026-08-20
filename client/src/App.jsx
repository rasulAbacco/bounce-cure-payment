import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import AdminChat from "./pages/AdminChat";
import InvoiceGenerator from "./pages/invoice/Invoicegenerator";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard Page */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/admin-chat" element={<AdminChat />} />
        <Route path="/Invoice" element={<InvoiceGenerator />} />
      </Routes>
    </BrowserRouter>
  );
}
