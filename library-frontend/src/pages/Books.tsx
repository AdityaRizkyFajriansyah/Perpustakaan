import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteBookApi, getBooksApi } from "../api/books";
import { borrowBookApi } from "../api/borrowings";
import { getCategoriesApi } from "../api/categories";
import { createReservationApi } from "../api/reservations";
import type { Book, Category, PaginationMeta } from "../types";
import { useAuth } from "../auth/AuthContext";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
import Popup from "../components/Popup";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Books() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const isAdmin = user?.role === "ADMIN";
  const nav = useNavigate();
  const isReturnOnly = isStudent && user?.accountStatus === "RETURN_ONLY";
  const isInactive = isStudent && user?.accountStatus === "INACTIVE";
  const canBorrow = isStudent && !isReturnOnly && !isInactive;

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [cats, setCats] = useState<Category[]>([]);
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Book | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchBooks = async (page = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getBooksApi({
        page,
        limit: meta.limit,
        q: q || undefined,
        sort,
        categoryId: categoryId ? Number(categoryId) : undefined,
      });
      setBooks(res.data.data);
      setMeta(res.data.meta);
    } catch (e: any) {
      setErr(e?.message || "Gagal mengambil data buku");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCategoriesApi();
        setCats(res.data);
      } catch {
        setCats([]);
      }
    })();
  }, []);

  const onBorrow = async (bookId: number) => {
    try {
      await borrowBookApi(bookId);
      await fetchBooks(meta.page);
      setPopup({ title: "Peminjaman berhasil", message: "Buku berhasil dipinjam.", variant: "success" });
    } catch (e: any) {
      setPopup({ title: "Peminjaman gagal", message: e?.message || "Gagal meminjam buku", variant: "error" });
    }
  };

  const onReserve = async (bookId: number) => {
    try {
      await createReservationApi(bookId);
      setPopup({ title: "Reservasi berhasil", message: "Anda masuk ke antrean.", variant: "success" });
    } catch (e: any) {
      setPopup({ title: "Reservasi gagal", message: e?.message || "Gagal reservasi buku", variant: "error" });
    }
  };

  const onDelete = async (bookId: number) => {
    setDeletingId(bookId);
    try {
      await deleteBookApi(bookId);
      setPopup({ title: "Berhasil", message: "Buku berhasil dihapus.", variant: "success" });
      await fetchBooks(meta.page);
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal menghapus buku", variant: "error" });
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  const rows = useMemo(() => books, [books]);

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
        <div className="text-xs uppercase tracking-[0.2em] muted">Katalog</div>
        <h1 className="text-2xl font-display mt-2">Katalog Buku</h1>
        <p className="text-sm muted mt-2">Cari buku berdasarkan judul atau penulis.</p>

        <form
          className="mt-5 grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto]"
          onSubmit={(e) => {
            e.preventDefault();
            fetchBooks(1);
          }}
        >
          <Input
            label="Search"
            placeholder="Contoh: harry potter"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Semua</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" type="submit" disabled={loading} className="w-full">
              Apply
            </Button>
          </div>
        </form>

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="font-semibold">Daftar Buku</div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="secondary" onClick={() => window.open("/api/exports/books?format=csv", "_blank")}>
                  Export CSV
                </Button>
                <Button variant="secondary" onClick={() => window.open("/api/exports/books?format=xlsx", "_blank")}>
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
            {rows.map((b) => {
              const isDigital = b.format === "DIGITAL";
              const coverUrl = b.coverPath ? `/covers/${b.coverPath}` : "";
              const canReserve = canBorrow && !isDigital && b.stock < 1;
              return (
                <div key={b.id} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 flex flex-col sm:flex-row gap-4">
                    <div className="h-28 w-20 shrink-0 rounded-xl border border-neutral-200 bg-white/70 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] muted">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={`Cover ${b.title}`}
                          className="h-full w-full rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>No Cover</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold">{b.title}</div>
                      <div className="text-sm muted">{b.author} | ISBN {b.isbn}</div>
                      {b.description && <p className="text-sm muted mt-2">{b.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="badge badge-amber">Category: {b.category?.name ?? b.categoryId}</span>
                        <span className={isDigital ? "badge badge-green" : "badge badge-amber"}>
                          Format: {isDigital ? "Digital" : "Fisik"}
                        </span>
                        {!isDigital && (
                          <span className={b.stock > 0 ? "badge badge-green" : "badge badge-red"}>
                            Stock: {b.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canBorrow && (
                    <Button
                      onClick={() => (canReserve ? onReserve(b.id) : onBorrow(b.id))}
                      disabled={!isDigital && b.stock < 1 && !canReserve}
                      className="lg:w-36"
                    >
                      {canReserve ? "Reserve" : "Borrow"}
                    </Button>
                  )}
                  {isAdmin && (
                    <div className="flex flex-col gap-2">
                      <Button variant="secondary" onClick={() => nav(`/admin/books/${b.id}/edit`)} className="lg:w-36">
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => setConfirmTarget(b)} className="lg:w-36">
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {rows.length === 0 && <div className="px-6 py-5 text-sm muted">Tidak ada data.</div>}
          </div>
        )}

        <div className="px-6 py-4 border-t border-neutral-200/80">
          <Pagination meta={meta} onPage={(p) => fetchBooks(p)} />
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
        title="Hapus Buku"
        message={`Buku "${confirmTarget?.title ?? ""}" akan dihapus permanen.`}
        confirmLabel="Hapus"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && onDelete(confirmTarget.id)}
        loading={deletingId === confirmTarget?.id}
      />
    </div>
  );
}
