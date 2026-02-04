# Perpustakaan - Library Management System

Sistem ini terdiri dari dua aplikasi: backend API (Node.js + Express + Prisma) dan frontend dashboard (React + Vite). Fokus utama adalah manajemen koleksi buku, peminjaman, reservasi, audit log, dan automasi siklus akun siswa.

## Fitur utama
- Admin
  - Kelola kategori buku.
  - Tambah, edit, hapus buku (fisik dan digital PDF).
  - Audit log aktivitas.
  - Impor akun siswa dari Excel.
  - Nonaktifkan akun siswa dan pantau status (aktif, return_only, nonaktif).
  - Laporan ringkas (tren peminjaman, buku terpopuler, total denda).
  - Ekspor data (books, borrowings, students, audit-logs) ke CSV/XLSX.
  - 2FA untuk akun admin.
- Siswa
  - Lihat katalog buku dan pinjam.
  - Reservasi buku fisik jika stok habis.
  - Lihat peminjaman, return, dan preview buku digital.
  - Terima notifikasi jatuh tempo dan reservasi.

## Arsitektur dan alur data
- Backend di `library-backend` menyediakan REST API di `/api`.
- Frontend di `library-frontend` memanggil API via `axios` dengan `baseURL: /api`.
- Vite dev server mem-proxy `/api` dan `/covers` ke backend `http://localhost:3000`.
- File cover disimpan di `library-backend/uploads/covers` dan diakses lewat `/covers/<filename>`.
- File ebook digital disimpan di `library-backend/uploads/ebooks` dan di-preview lewat `/api/books/:id/preview`.

## Struktur folder
- `library-backend/`: API, Prisma, jobs, scripts seed.
- `library-frontend/`: React app (pages, components, api client).

## Environment variables (backend)
Wajib:
- `PORT` (default 3000)
- `DATABASE_URL` (PostgreSQL)
- `JWT_SECRET`
- `ADMIN_PASSWORD` (untuk seed admin)
- `STUDENT_PASSWORD` (untuk seed student)
- `ALLOWED_ORIGINS` (mis. `http://localhost:5173`)

Opsional:
- `NODE_ENV` (pengaruh cookie secure dan Helmet CSP)
- `TRUST_PROXY` (set jika dibalik reverse proxy)
- `LATE_FEE_PER_DAY` (default 1000)
- `DUE_SOON_DAYS` (default 2)
- `RESERVATION_HOLD_HOURS` (default 48)

## Setup cepat (lokal)
Prasyarat: Node.js, npm, PostgreSQL.

### Backend
```bash
cd library-backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed:admin
npm run seed:student
npm run dev
```

### Frontend
```bash
cd library-frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173` dan otomatis proxy ke backend `http://localhost:3000`.

## Akun awal (seed)
- Admin: `admin@library.com` dengan password dari `ADMIN_PASSWORD`.
- Student: `student@library.com` dengan password dari `STUDENT_PASSWORD`.
- Siswa hasil import: login memakai NISN (atau email `nisn@student.local`) dan password sesuai kolom `nama_orangtua`.

## Otomasi terjadwal (jobs)
Berjalan sekali saat server start dan setiap 24 jam:
- `studentLifecycle`: auto return-only untuk kelas 6 pada 5 Juli, auto-promote kelas pada 5 Juli, dan hapus akun graduate di akhir Agustus.
- `notificationJobs`: notifikasi due soon dan overdue.
- `reservationCleanup`: expire reservasi READY yang sudah lewat dan naikkan antrian berikutnya.
- `ipBlockCleanup`: bersihkan blok IP yang sudah kadaluarsa.

## Aturan bisnis penting
- Maksimal pinjam aktif: 2 buku per siswa.
- Durasi pinjam: 7 hari dari tanggal pinjam.
- Denda: `lateDays * LATE_FEE_PER_DAY`.
- Buku fisik: stok dikurangi saat dipinjam, ditambah saat dikembalikan.
- Buku digital: stok tidak berlaku, harus ada file PDF untuk dipinjam.
- Preview buku digital hanya jika sedang dipinjam dan belum lewat due date.
- Reservasi hanya untuk buku fisik yang stok habis.
- Reservasi READY memiliki masa hold `RESERVATION_HOLD_HOURS`.

## Ringkasan endpoint API
Semua endpoint berada di `/api`.
- Auth: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/2fa/*`
- Books: `GET /books`, `POST /books`, `PATCH /books/:id`, `DELETE /books/:id`, `POST /books/digital`, `GET /books/:id/preview`
- Borrowings: `POST /borrowings`, `GET /borrowings`, `PATCH /borrowings/:id/return`
- Categories: `GET /categories`, `POST /categories`, `DELETE /categories/:id`
- Students: `POST /students/import`, `GET /students`, `PATCH /students/:id/deactivate`
- Reservations: `POST /reservations`, `GET /reservations`, `PATCH /reservations/:id/cancel`
- Notifications: `GET /notifications`, `PATCH /notifications/:id/read`
- Reports: `GET /reports/overview`
- Exports: `GET /exports/books|borrowings|students|audit-logs` (format `csv|xlsx`)
- Audit logs: `GET /audit-logs`
- IP blocks: `GET /ip-blocks`, `DELETE /ip-blocks?ip=...`

## Model data (Prisma)
Model utama:
- `User` (role ADMIN/STUDENT, accountStatus ACTIVE/RETURN_ONLY/INACTIVE, 2FA)
- `Category`
- `Book` (format PHYSICAL/DIGITAL, file info, cover)
- `Borrowing` (status DIPINJAM/DIKEMBALIKAN, dueDate, lateFee)
- `Reservation` (status ACTIVE/READY/FULFILLED/CANCELLED/EXPIRED)
- `Notification` (type DUE_SOON/OVERDUE/RESERVATION_READY/SYSTEM)
- `AuditLog`
- `LoginRateLimitBlock`

## Keamanan
- JWT disimpan di httpOnly cookie dan digunakan di middleware `auth`.
- CSRF token disimpan di cookie `csrfToken`, wajib untuk method non-GET tanpa Authorization header.
- Rate limit API umum: 300 request per 15 menit.
- Login rate limit: 5 request per 15 menit, strike IP diblokir sementara jika berulang.
- Akun user juga memakai lock sementara setelah gagal login berulang.
- 2FA (TOTP) khusus admin.

## Uploads
- Cover: JPG/PNG/WEBP, maksimal 5MB.
- Ebook digital: PDF, maksimal 20MB.

