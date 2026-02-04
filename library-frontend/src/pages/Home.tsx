import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/Button";
import { formatRoleLabel } from "../utils/roleLabel";

export default function Home() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="card p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.2em] muted">Dashboard</div>
        <h1 className="text-3xl md:text-4xl font-display mt-2">Selamat datang, {user?.name}</h1>
        <p className="mt-3 text-sm muted">
          Anda login sebagai <span className="font-semibold text-neutral-900">{formatRoleLabel(user?.role)}</span>. Kelola koleksi,
          peminjaman, dan laporan perpustakaan dalam satu tampilan.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/books" className="btn btn-primary">Lihat Katalog</Link>
          <Button variant="secondary" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/books" className="card p-5 action-card">
          <div className="text-xs uppercase tracking-[0.2em] muted">Katalog</div>
          <div className="mt-2 text-lg font-display">Koleksi Buku</div>
          <p className="text-sm muted mt-2">Cari buku berdasarkan judul, penulis, atau kategori.</p>
        </Link>
        <Link to="/borrowings" className="card p-5 action-card">
          <div className="text-xs uppercase tracking-[0.2em] muted">Peminjaman</div>
          <div className="mt-2 text-lg font-display">Status Peminjaman</div>
          <p className="text-sm muted mt-2">Pantau jadwal pengembalian dan histori peminjaman.</p>
        </Link>
        {isAdmin ? (
          <Link to="/admin/audit-logs" className="card p-5 action-card">
            <div className="text-xs uppercase tracking-[0.2em] muted">Admin</div>
            <div className="mt-2 text-lg font-display">Audit & Kontrol</div>
            <p className="text-sm muted mt-2">Tinjau aktivitas admin dan perubahan data.</p>
          </Link>
        ) : (
          <div className="card p-5 action-card">
            <div className="text-xs uppercase tracking-[0.2em] muted">Tips</div>
            <div className="mt-2 text-lg font-display">Pinjam dengan rapi</div>
            <p className="text-sm muted mt-2">Pastikan pengembalian tepat waktu untuk menjaga stok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
