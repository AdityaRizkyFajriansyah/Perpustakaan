import { useEffect, useState } from "react";
import type { Notification, PaginationMeta } from "../types";
import { getNotificationsApi, markNotificationReadApi } from "../api/notifications";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import Popup from "../components/Popup";

export default function Notifications() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getNotificationsApi({ page, limit: meta.limit });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRead = async (id: number) => {
    try {
      await markNotificationReadApi(id);
      await fetchNotifications(meta.page);
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal memperbarui notifikasi", variant: "error" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Notifikasi</div>
        <h1 className="text-2xl font-display mt-2">Pemberitahuan</h1>
        <p className="text-sm muted mt-2">Informasi jatuh tempo, reservasi, dan status buku.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="font-semibold">Notifikasi</div>
          <div className="text-sm muted">Total: {meta.total}</div>
        </div>

        {loading ? (
          <div className="px-6 py-4 text-sm muted">Loading...</div>
        ) : (
          <div className="divide-y divide-neutral-200/80">
            {data.map((n) => (
              <div key={n.id} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{n.title}</div>
                  <div className="text-sm muted">{n.message}</div>
                  <div className="text-xs muted mt-2">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {n.status === "UNREAD" && (
                  <Button variant="secondary" onClick={() => onRead(n.id)} className="lg:w-28">
                    Tandai
                  </Button>
                )}
              </div>
            ))}
            {data.length === 0 && <div className="px-6 py-5 text-sm muted">Tidak ada notifikasi.</div>}
          </div>
        )}

        <div className="px-6 py-4 border-t border-neutral-200/80">
          <Pagination meta={meta} onPage={(p) => fetchNotifications(p)} />
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
