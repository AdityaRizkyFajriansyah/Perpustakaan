import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="card p-6 max-w-md">
      <div className="text-xs uppercase tracking-[0.2em] muted">404</div>
      <h1 className="text-2xl font-display mt-2">Halaman tidak ditemukan</h1>
      <p className="text-sm muted mt-2">Periksa kembali alamat halaman atau kembali ke menu utama.</p>
      <Link className="btn btn-secondary mt-4 inline-flex" to="/">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
