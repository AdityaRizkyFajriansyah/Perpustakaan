import { useEffect, useState } from "react";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import Pagination from "../../components/Pagination";
import Popup from "../../components/Popup";
import ConfirmDialog from "../../components/ConfirmDialog";
import { deactivateStudentApi, getStudentsApi } from "../../api/students";
import type { PaginationMeta, User } from "../../types";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function Students() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "return_only" | "">("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getStudentsApi({
        page,
        limit: meta.limit,
        q: q || undefined,
        status: status || undefined,
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e: any) {
      setErr(e?.message || "Gagal mengambil data siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDeactivate = async (studentId: number) => {
    try {
      setDeactivateLoading(true);
      await deactivateStudentApi(studentId, "TRANSFERRED");
      setPopup({ title: "Akun dinonaktifkan", message: "Siswa berhasil dinonaktifkan.", variant: "success" });
      await fetchStudents(meta.page);
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal menonaktifkan siswa", variant: "error" });
    } finally {
      setDeactivateLoading(false);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Siswa</div>
        <h1 className="text-2xl font-display mt-2">Data Siswa</h1>
        <p className="text-sm muted mt-2">
          Akun kelas 6 otomatis berubah menjadi return only mulai 5 Juli dan dihapus di akhir Agustus.
        </p>
        <p className="text-sm muted mt-1">Kenaikan kelas otomatis dijalankan pada 5 Juli.</p>

        <div className="mt-5 grid gap-3 md:grid-cols-[2fr,1fr,auto]">
          <Input
            label="Search"
            placeholder="Cari nama, NISN, atau kelas"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "return_only" | "")}
          >
            <option value="">Semua</option>
            <option value="active">Aktif</option>
            <option value="return_only">Return Only</option>
            <option value="inactive">Nonaktif</option>
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => fetchStudents(1)} disabled={loading} className="w-full">
              Apply
            </Button>
          </div>
        </div>

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="font-semibold">Daftar Siswa</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => window.open("/api/exports/students?format=csv", "_blank")}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => window.open("/api/exports/students?format=xlsx", "_blank")}>
              Export XLSX
            </Button>
            <div className="text-sm muted">Total: {meta.total}</div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-4 text-sm muted">Loading...</div>
        ) : (
          <div className="divide-y divide-neutral-200/80">
            {data.map((student) => (
              <div key={student.id} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{student.name}</div>
                  <div className="text-sm muted">NISN: {student.nisn ?? "-"} | Kelas: {student.kelas ?? "-"}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={
                        student.accountStatus === "ACTIVE"
                          ? "badge badge-green"
                          : student.accountStatus === "RETURN_ONLY"
                            ? "badge badge-amber"
                            : "badge badge-red"
                      }
                    >
                      {student.accountStatus === "RETURN_ONLY"
                        ? "RETURN ONLY"
                        : student.accountStatus === "INACTIVE"
                          ? "NONAKTIF"
                          : "AKTIF"}
                    </span>
                    {student.accountStatus && student.accountStatus !== "ACTIVE" && (
                      <span className="text-xs muted">
                        {student.statusReason ?? "-"} - {formatDate(student.statusChangedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {student.accountStatus === "ACTIVE" && (
                  <Button variant="danger" className="lg:w-40" onClick={() => setConfirmTarget(student)}>
                    Nonaktifkan
                  </Button>
                )}
              </div>
            ))}

            {data.length === 0 && <div className="px-6 py-5 text-sm muted">Tidak ada data.</div>}
          </div>
        )}

        <div className="px-6 py-4 border-t border-neutral-200/80">
          <Pagination meta={meta} onPage={(p) => fetchStudents(p)} />
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
        title="Nonaktifkan akun siswa?"
        message={`Akun ${confirmTarget?.name ?? "siswa"} akan dinonaktifkan dan tidak bisa login lagi.`}
        confirmLabel="Nonaktifkan"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && onDeactivate(confirmTarget.id)}
        loading={deactivateLoading}
      />
    </div>
  );
}
