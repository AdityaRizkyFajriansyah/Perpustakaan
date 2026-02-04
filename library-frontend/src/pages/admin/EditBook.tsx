import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBookApi, updateBookApi } from "../../api/books";
import { getCategoriesApi } from "../../api/categories";
import type { Book, Category } from "../../types";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import Popup from "../../components/Popup";

export default function EditBook() {
  const { bookId } = useParams();
  const nav = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [year, setYear] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [bookRes, catRes] = await Promise.all([
          getBookApi(Number(bookId)),
          getCategoriesApi(),
        ]);
        const data = bookRes.data;
        setBook(data);
        setTitle(data.title);
        setAuthor(data.author);
        setIsbn(data.isbn);
        setYear(String(data.year ?? ""));
        setStock(String(data.stock ?? ""));
        setCategoryId(String(data.categoryId));
        setDescription(data.description ?? "");
        setCats(catRes.data);
      } catch (e: any) {
        setPopup({ title: "Gagal", message: e?.message || "Gagal memuat data buku", variant: "error" });
      }
    })();
  }, [bookId]);

  const onSave = async () => {
    if (!book) return;
    const parsedYear = Number(year);
    if (Number.isNaN(parsedYear)) {
      setPopup({ title: "Gagal", message: "Tahun tidak valid", variant: "error" });
      return;
    }
    if (!categoryId) {
      setPopup({ title: "Gagal", message: "Kategori belum dipilih", variant: "error" });
      return;
    }
    const payload: any = {
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      year: parsedYear,
      categoryId: Number(categoryId),
      description: description.trim(),
    };
    if (book.format === "PHYSICAL") {
      const parsedStock = Number(stock);
      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        setPopup({ title: "Gagal", message: "Stock tidak valid", variant: "error" });
        return;
      }
      payload.stock = parsedStock;
    }
    if (cover) payload.cover = cover;

    setLoading(true);
    try {
      await updateBookApi(book.id, payload);
      setPopup({ title: "Berhasil", message: "Buku diperbarui.", variant: "success" });
      nav("/books");
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal memperbarui buku", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!book) {
    return <div className="text-sm muted">Memuat data buku...</div>;
  }

  return (
    <>
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Edit Buku</div>
        <h1 className="text-2xl font-display mt-2">Perbarui Buku</h1>
        <p className="text-sm muted mt-2">Ubah detail buku sesuai kebutuhan.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Input label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          {book.format === "PHYSICAL" && (
            <Input label="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
          )}
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <label className="block">
            <div className="label">Cover Baru (opsional)</div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="mt-2 block"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block md:col-span-2">
            <div className="label">Deskripsi / Sinopsis</div>
            <textarea
              className="field"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan ringkasan buku"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <Button onClick={onSave} disabled={loading}>Simpan</Button>
          <Button variant="secondary" onClick={() => nav("/books")} disabled={loading}>Batal</Button>
        </div>
      </div>

      <Popup
        open={!!popup}
        title={popup?.title || ""}
        message={popup?.message || ""}
        variant={popup?.variant}
        onClose={() => setPopup(null)}
      />
    </>
  );
}
