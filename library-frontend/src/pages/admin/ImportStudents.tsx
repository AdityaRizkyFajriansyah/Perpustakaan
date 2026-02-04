import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../../components/Button";
import { importStudentsApi, type ImportStudentsResult } from "../../api/students";

export default function ImportStudents() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportStudentsResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErr("Pilih file Excel terlebih dahulu.");
      return;
    }
    setErr(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await importStudentsApi(file);
      setResult(res.data);
    } catch (e: any) {
      setErr(e?.message || "Gagal import siswa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Impor Siswa</div>
        <h1 className="text-2xl font-display mt-2">Impor Akun Siswa</h1>
        <p className="text-sm muted mt-2">
          Upload file Excel dengan kolom case-sensitive: nisn, nama, kelas, nama_orangtua.
        </p>
        <p className="text-sm muted mt-2">Pastikan kolom nisn diset sebagai teks agar nol di depan tidak hilang.</p>
        <p className="text-sm muted mt-2">Password siswa otomatis menggunakan nilai kolom nama_orangtua.</p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </div>
        </form>

        {err && <div className="mt-4 text-sm text-red-600">{err}</div>}
      </div>

      {result && (
        <div className="card p-6">
          <div className="font-semibold">Hasil Import</div>
          <div className="mt-2 text-sm muted">Created: {result.created}</div>
          <div className="text-sm muted">Skipped: {result.skipped}</div>
          {result.errors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold">Errors</div>
              <ul className="mt-2 text-sm muted list-disc pl-5">
                {result.errors.slice(0, 8).map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
