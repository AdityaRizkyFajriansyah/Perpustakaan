import { useEffect, useState } from "react";
import type { AuditLog, PaginationMeta } from "../../types";
import { getAuditLogsApi } from "../../api/audit";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Pagination from "../../components/Pagination";

export default function AuditLogs() {
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [data, setData] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getAuditLogsApi({
        page,
        limit: meta.limit,
        action: action || undefined,
        entity: entity || undefined,
        userId: userId ? Number(userId) : undefined,
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e: any) {
      setErr(e?.message || "Gagal mengambil audit log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Log Audit</div>
        <h1 className="text-2xl font-display mt-2">Jejak Aktivitas</h1>
        <p className="text-sm muted mt-2">Filter berdasarkan action, entity, atau user ID.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="Action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="LOGIN / CREATE_BOOK" />
          <Input label="Entity" value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="User / Book / Category" />
          <Input label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="1" />
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={() => fetchLogs(1)} disabled={loading}>
              Apply
            </Button>
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="font-semibold">Log</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => window.open("/api/exports/audit-logs?format=csv", "_blank")}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => window.open("/api/exports/audit-logs?format=xlsx", "_blank")}>
              Export XLSX
            </Button>
            <div className="text-sm muted">Total: {meta.total}</div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-4 text-sm muted">Loading...</div>
        ) : (
          <div className="divide-y divide-neutral-200/80">
            {data.map((l) => (
              <div key={l.id} className="px-6 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-amber">{l.action}</span>
                  <span className="badge badge-green">{l.entity}</span>
                  <span className="text-sm">#{l.entityId ?? "-"}</span>
                </div>
                <div className="text-sm muted mt-2">
                  User: {l.user ? `${l.user.name} (${l.user.email})` : l.userId ?? "-"} | IP: {l.ipAddress ?? "-"}
                </div>
                <div className="text-xs muted mt-1">{new Date(l.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {data.length === 0 && <div className="px-6 py-5 text-sm muted">Tidak ada data.</div>}
          </div>
        )}

        <div className="px-6 py-4 border-t border-neutral-200/80">
          <Pagination meta={meta} onPage={(p) => fetchLogs(p)} />
        </div>
      </div>
    </div>
  );
}
