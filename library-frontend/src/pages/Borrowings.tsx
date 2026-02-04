import { useEffect, useState } from "react";
import type { Borrowing, BorrowingStatus, PaginationMeta } from "../types";
import { getBorrowingsApi, returnBookApi } from "../api/borrowings";
import { useAuth } from "../auth/AuthContext";
import Select from "../components/Select";
import Input from "../components/Input";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
import Popup from "../components/Popup";

export default function Borrowings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";
  const isReturnOnly = user?.role === "STUDENT" && user?.accountStatus === "RETURN_ONLY";
  const isInactive = user?.role === "STUDENT" && user?.accountStatus === "INACTIVE";

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const [status, setStatus] = useState<BorrowingStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);

  const [data, setData] = useState<Borrowing[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchBorrowings = async (page = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getBorrowingsApi({
        page,
        limit: meta.limit,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e: any) {
      setErr(e?.message || "Gagal mengambil data peminjaman");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReturn = async (borrowingId: number) => {
    try {
      await returnBookApi(borrowingId);
      setPopup({ title: "Pengembalian berhasil", message: "Buku berhasil dikembalikan.", variant: "success" });
      await fetchBorrowings(meta.page);
    } catch (e: any) {
      setPopup({ title: "Pengembalian gagal", message: e?.message || "Gagal return buku", variant: "error" });
    }
  };

  const onPreview = (bookId: number) => {
    window.open(`/api/books/${bookId}/preview`, "_blank", "noopener,noreferrer");
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.open(`/api/exports/borrowings?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-5">
      {isReturnOnly && (
        <div className="card-soft p-4 text-sm">
          <div className="font-semibold">Status akun: Return Only</div>
          <div className="muted">Anda hanya bisa mengembalikan buku sampai akhir Agustus.</div>
        </div>
      )}
      {isInactive && (
        <div className="card-soft p-4 text-sm">
          <div className="font-semibold">Status akun: Nonaktif</div>
          <div className="muted">Akun tidak dapat digunakan untuk meminjam buku.</div>
        </div>
      )}
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Peminjaman</div>
        <h1 className="text-2xl font-display mt-2">Daftar Peminjaman</h1>
        <p className="text-sm muted mt-2">Filter berdasarkan status dan rentang tanggal.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as BorrowingStatus | "")}>
            <option value="">Semua</option>
            <option value="DIPINJAM">DIPINJAM</option>
            <option value="DIKEMBALIKAN">DIKEMBALIKAN</option>
          </Select>
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => fetchBorrowings(1)} disabled={loading} className="w-full">
              Apply
            </Button>
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="font-semibold">Peminjaman</div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="secondary" onClick={() => handleExport("csv")}>
                  Export CSV
                </Button>
                <Button variant="secondary" onClick={() => handleExport("xlsx")}>
                  Export XLSX
                </Button>
              </>
            )}
            <div className="text-sm muted">Total: {meta.total}</div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-4 text-sm muted">Loading...</div>
        ) : (
          <div className="divide-y divide-neutral-200/80">
            {data.map((b) => (
              <div key={b.id} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{b.book?.title ?? `Book #${b.bookId}`}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={b.status === "DIPINJAM" ? "badge badge-amber" : "badge badge-green"}>{b.status}</span>
                    {isAdmin && b.user && (
                      <span className="badge badge-amber">{b.user.name} - {b.user.email}</span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="text-xs muted mt-2">
                      Peminjam: {b.user ? `${b.user.name} (${b.user.email})` : `User #${b.userId}`}
                    </div>
                  )}
                  <div className="text-xs muted mt-1">
                    Borrow: {formatDate(b.borrowDate)} | Due: {formatDate(b.dueDate)}
                  </div>
                  {b.status === "DIKEMBALIKAN" && (
                    <div className="text-xs muted mt-1">
                      Late: {b.lateDays ?? 0} hari | Fee: Rp {b.lateFee ?? 0}
                    </div>
                  )}
                </div>

                {b.status === "DIPINJAM" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {isStudent && b.book?.format === "DIGITAL" && (
                      <Button variant="secondary" className="lg:w-32" onClick={() => onPreview(b.bookId)}>
                        Preview
                      </Button>
                    )}
                    <Button variant="danger" className="lg:w-32" onClick={() => onReturn(b.id)}>
                      Return
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {data.length === 0 && <div className="px-6 py-5 text-sm muted">Tidak ada data.</div>}
          </div>
        )}

        <div className="px-6 py-4 border-t border-neutral-200/80">
          <Pagination meta={meta} onPage={(p) => fetchBorrowings(p)} />
        </div>
      </div>

      <Popup
        open={!!popup}
        title={popup?.title || ""}
        message={popup?.message || ""}
        variant={popup?.variant}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}
