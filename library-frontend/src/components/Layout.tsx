import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "./Button";
import { formatRoleLabel } from "../utils/roleLabel";

function LinkItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => ["nav-link", isActive ? "nav-link-active" : ""].join(" ").trim()}
    >
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const profileName = user ? user.name || formatRoleLabel(user.role) : "";

  return (
    <div className="min-h-screen">
      <header className="app-header">
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="brand-mark" />
              <div>
                <div className="text-2xl font-display">Perpustakaan</div>
                <div className="text-sm text-white/80">Library management dashboard</div>
              </div>
            </div>

            {user && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-white/80">Profil: {profileName}</div>
                <Button variant="secondary" onClick={logout}>
                  Logout
                </Button>
              </div>
            )}
          </div>

          {user && (
            <nav className="mt-6 flex flex-wrap gap-2">
              <LinkItem to="/" label="Beranda" />
              <LinkItem to="/books" label="Buku" />
              <LinkItem to="/borrowings" label="Peminjaman" />
              <LinkItem to="/reservations" label="Reservasi" />
              <LinkItem to="/notifications" label="Notifikasi" />
              {user.role === "ADMIN" && (
                <>
                  <LinkItem to="/admin/categories" label="Kategori" />
                  <LinkItem to="/admin/books/new" label="Tambah Buku" />
                  <LinkItem to="/admin/audit-logs" label="Log Audit" />
                  <LinkItem to="/admin/students" label="Siswa" />
                  <LinkItem to="/admin/students/import" label="Impor Siswa" />
                  <LinkItem to="/admin/security" label="Keamanan" />
                  <LinkItem to="/admin/reports" label="Laporan" />
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
