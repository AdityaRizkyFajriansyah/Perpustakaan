import { useEffect, useState } from "react";
import { getOverviewReportApi } from "../../api/reports";
import type { ReportOverview } from "../../types";

export default function Reports() {
  const [data, setData] = useState<ReportOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOverviewReportApi();
        setData(res.data);
      } catch (e: any) {
        setErr(e?.message || "Gagal mengambil laporan");
      }
    })();
  }, []);

  const trendEntries = data
    ? Object.entries(data.trends).sort(([a], [b]) => a.localeCompare(b))
    : [];

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Laporan</div>
        <h1 className="text-2xl font-display mt-2">Ringkasan Perpustakaan</h1>
        <p className="text-sm muted mt-2">Statistik peminjaman dan aktivitas terbaru.</p>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </div>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <div className="text-xs uppercase tracking-[0.2em] muted">Total Buku</div>
              <div className="text-2xl font-semibold mt-2">{data.totals.totalBooks}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-[0.2em] muted">Siswa</div>
              <div className="text-2xl font-semibold mt-2">{data.totals.totalStudents}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-[0.2em] muted">Peminjaman Aktif</div>
              <div className="text-2xl font-semibold mt-2">{data.totals.activeBorrowings}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-[0.2em] muted">Overdue</div>
              <div className="text-2xl font-semibold mt-2">{data.totals.overdueBorrowings}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-[0.2em] muted">Reservasi Aktif</div>
              <div className="text-2xl font-semibold mt-2">{data.totals.activeReservations}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-[0.2em] muted">Total Denda</div>
              <div className="text-2xl font-semibold mt-2">Rp {data.totals.totalLateFees}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <div className="font-semibold">Tren Peminjaman (6 bulan)</div>
              <div className="mt-3 space-y-2 text-sm">
                {trendEntries.length === 0 && <div className="muted">Belum ada data.</div>}
                {trendEntries.map(([month, count]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span>{month}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <div className="font-semibold">Buku Terpopuler</div>
              <div className="mt-3 space-y-2 text-sm">
                {data.topBorrowedBooks.length === 0 && <div className="muted">Belum ada data.</div>}
                {data.topBorrowedBooks.map((b) => (
                  <div key={b.bookId} className="flex items-center justify-between">
                    <span>{b.title}</span>
                    <span className="font-semibold">{b.totalBorrowed}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
