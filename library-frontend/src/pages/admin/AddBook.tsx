import { useEffect, useState } from "react";
import { createBookApi, createDigitalBookApi } from "../../api/books";
import { getCategoriesApi } from "../../api/categories";
import type { Category } from "../../types";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import Popup from "../../components/Popup";

export default function AddBook() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [year, setYear] = useState<string>("");
  const [stock, setStock] = useState<string>("1");
  const [categoryId, setCategoryId] = useState<string>("");
  const [format, setFormat] = useState<"PHYSICAL" | "DIGITAL">("PHYSICAL");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [popup, setPopup] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await getCategoriesApi();
      setCats(res.data);
      if (res.data[0]) setCategoryId(String(res.data[0].id));
    })();
  }, []);

  const onCreate = async () => {
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedIsbn = isbn.trim();
    const parsedYear = Number(year);
    const parsedCategoryId = Number(categoryId);

    if (!trimmedTitle || !trimmedAuthor || !trimmedIsbn) {
      setPopup({ title: "Gagal", message: "Judul, penulis, dan ISBN wajib diisi.", variant: "error" });
      return;
    }
    if (!year || Number.isNaN(parsedYear)) {
      setPopup({ title: "Gagal", message: "Tahun terbit wajib diisi.", variant: "error" });
      return;
    }
    if (!categoryId || Number.isNaN(parsedCategoryId)) {
      setPopup({ title: "Gagal", message: "Kategori belum dipilih.", variant: "error" });
      return;
    }
    if (format === "PHYSICAL") {
      const parsedStock = Number(stock);
      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        setPopup({ title: "Gagal", message: "Stock tidak valid.", variant: "error" });
        return;
      }
    }
    if (format === "DIGITAL" && !file) {
      setPopup({ title: "Gagal", message: "File PDF wajib diupload.", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const descriptionValue = description.trim() || undefined;
      if (format === "DIGITAL") {
        await createDigitalBookApi({
          title: trimmedTitle,
          author: trimmedAuthor,
          isbn: trimmedIsbn,
          year: parsedYear,
          categoryId: parsedCategoryId,
          file: file as File,
          cover,
          description: descriptionValue,
        });
        setPopup({ title: "Berhasil", message: "Buku digital berhasil ditambahkan.", variant: "success" });
      } else {
        const parsedStock = Number(stock);
        await createBookApi({
          title: trimmedTitle,
          author: trimmedAuthor,
          isbn: trimmedIsbn,
          year: parsedYear,
          stock: parsedStock,
          categoryId: parsedCategoryId,
          cover,
          description: descriptionValue,
        });
        setPopup({ title: "Berhasil", message: "Buku berhasil ditambahkan.", variant: "success" });
      }
      setTitle("");
      setAuthor("");
      setIsbn("");
      setYear("");
      setStock("1");
      setFile(null);
      setCover(null);
      setDescription("");
    } catch (e: any) {
      setPopup({ title: "Gagal", message: e?.message || "Gagal menambahkan buku", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card p-6">
        <div className="text-xs uppercase tracking-[0.2em] muted">Tambah Buku</div>
        <h1 className="text-2xl font-display mt-2">Tambah Buku Baru</h1>
        <p className="text-sm muted mt-2">Lengkapi informasi buku sebelum disimpan ke katalog.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Input label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          {format === "PHYSICAL" && (
            <Input label="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
          )}
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Format" value={format} onChange={(e) => setFormat(e.target.value as "PHYSICAL" | "DIGITAL")}>
            <option value="PHYSICAL">Fisik</option>
            <option value="DIGITAL">Digital (PDF)</option>
          </Select>
          <label className="block">
            <div className="label">Cover Buku (opsional)</div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="mt-2 block"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs muted mt-2">JPG/PNG/WEBP, maksimal 5MB.</div>
          </label>
          {format === "DIGITAL" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] muted">File PDF</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="mt-2 block"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs muted mt-2">Maksimal 20MB.</div>
            </div>
          )}
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

        <div className="mt-5">
          <Button onClick={onCreate} disabled={loading}>Create Book</Button>
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
