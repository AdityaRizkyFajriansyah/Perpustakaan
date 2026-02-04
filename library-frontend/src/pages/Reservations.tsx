import { useEffect, useState } from "react";
import type { PaginationMeta, Reservation, ReservationStatus } from "../types";
import { cancelReservationApi, getReservationsApi } from "../api/reservations";
import { useAuth } from "../auth/AuthContext";
import Select from "../components/Select";
import Input from "../components/Input";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
import Popup from "../components/Popup";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Reservations() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [status, setStatus] = useState<ReservationStatus | "">("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Reservation | null>(null);

  const [data, setData] = useState<Reservation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchReservations = async (page = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getReservationsApi({
        page,
        limit: meta.limit,
        status: status || undefined,
        q: q || undefined,
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e: any) {
      setErr(e?.message || "Gagal mengambil data reservasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCancel = async (reservationId: number) => {
    try {
      await cancelReservationApi(reservationId);
      setPopup({ title: "Reservasi dibatalkan", message: "Reservasi berhasil dibatalkan.", variant: "success" });
      await fetchReservations(meta.page);
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal membatalkan reservasi", variant: "error" });
    } finally {
      setConfirmTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Reservasi</div>
        <h1 className="text-2xl font-display mt-2">Antrean Reservasi</h1>
        <p className="text-sm muted mt-2">Pantau status reservasi buku fisik.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[2fr,1fr,auto] gap-3">
          <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Judul atau nama" />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus | "")}>
            <option value="">Semua</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="READY">READY</option>
            <option value="FULFILLED">FULFILLED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="EXPIRED">EXPIRED</option>
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => fetchReservations(1)} disabled={loading} className="w-full">
              Apply
            </Button>
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="font-semibold">Reservasi</div>
          <div className="text-sm muted">Total: {meta.total}</div>
        </div>

        {loading ? (
          <div className="px-6 py-4 text-sm muted">Loading...</div>
        ) : (
          <div className="divide-y divide-neutral-200/80">
            {data.map((r) => (
              <div key={r.id} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{r.book?.title ?? `Book #${r.bookId}`}</div>
                  <div className="text-sm muted">Status: {r.status}</div>
                  {isAdmin && r.user && (
                    <div className="text-xs muted mt-2">Pemesan: {r.user.name} ({r.user.email})</div>
                  )}
                </div>

                {["ACTIVE", "READY"].includes(r.status) && (
                  <Button variant="danger" className="lg:w-32" onClick={() => setConfirmTarget(r)}>
                    Batalkan
                  </Button>
                )}
              </div>
            ))}
            {data.length === 0 && <div className="px-6 py-5 text-sm muted">Tidak ada data.</div>}
          </div>
        )}

        <div className="px-6 py-4 border-t border-neutral-200/80">
          <Pagination meta={meta} onPage={(p) => fetchReservations(p)} />
        </div>
      </div>

      <Popup
        open={!!popup}
        title={popup?.title || ""}
        message={popup?.message || ""}
        variant={popup?.variant}
        onClose={() => setPopup(null)}
      />
      <ConfirmDialog
        open={!!confirmTarget}
        title="Batalkan reservasi?"
        message="Reservasi akan dibatalkan."
        confirmLabel="Batalkan"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && onCancel(confirmTarget.id)}
      />
    </div>
  );
}
