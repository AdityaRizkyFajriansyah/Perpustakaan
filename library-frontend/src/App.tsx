import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./auth/RequireAuth";
import RequireRole from "./auth/RequireRole";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Books from "./pages/Books";
import Borrowings from "./pages/Borrowings";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Reservations from "./pages/Reservations";

import AdminHome from "./pages/admin/AdminHome";
import Categories from "./pages/admin/Categories";
import AddBook from "./pages/admin/AddBook";
import AuditLogs from "./pages/admin/AuditLogs";
import ImportStudents from "./pages/admin/ImportStudents";
import Students from "./pages/admin/Students";
import Security from "./pages/admin/Security";
import Reports from "./pages/admin/Reports";
import EditBook from "./pages/admin/EditBook";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/borrowings" element={<Borrowings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reservations" element={<Reservations />} />

          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/books/new" element={<AddBook />} />
            <Route path="/admin/books/:bookId/edit" element={<EditBook />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/students/import" element={<ImportStudents />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/security" element={<Security />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
