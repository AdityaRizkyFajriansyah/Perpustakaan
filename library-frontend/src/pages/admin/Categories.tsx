import { useEffect, useState } from "react";
import type { Category } from "../../types";
import { createCategoryApi, deleteCategoryApi, getCategoriesApi } from "../../api/categories";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Popup from "../../components/Popup";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function Categories() {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Category | null>(null);

  const load = async () => {
    const res = await getCategoriesApi();
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createCategoryApi(name.trim());
      setName("");
      await load();
      setPopup({ title: "Berhasil", message: "Kategori berhasil dibuat.", variant: "success" });
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal membuat kategori", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (categoryId: number) => {
    setDeletingId(categoryId);
    try {
      await deleteCategoryApi(categoryId);
      await load();
      setPopup({ title: "Berhasil", message: "Kategori berhasil dihapus.", variant: "success" });
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal menghapus kategori", variant: "error" });
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Kategori</div>
        <h1 className="text-2xl font-display mt-2">Kategori Buku</h1>
        <p className="text-sm muted mt-2">Tambahkan kategori untuk menjaga klasifikasi koleksi.</p>
        <div className="mt-5 flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input label="Nama kategori" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="md:pt-6">
            <Button onClick={onCreate} disabled={loading}>Create</Button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="font-semibold">Daftar Kategori</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((c) => (
            <div key={c.id} className="chip flex items-center gap-2">
              <span>#{c.id} {c.name}</span>
              <button
                type="button"
                className="text-xs text-red-700 hover:underline"
                onClick={() => setConfirmTarget(c)}
                disabled={deletingId === c.id}
              >
                {deletingId === c.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm muted">Tidak ada data.</div>}
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
        title="Hapus kategori?"
        message={`Kategori "${confirmTarget?.name ?? ""}" akan dihapus.`}
        confirmLabel="Hapus"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && onDelete(confirmTarget.id)}
        loading={deletingId === confirmTarget?.id}
      />
    </div>
  );
}
