# Manual Book - Website Perpustakaan

Dokumen ini menjelaskan cara penggunaan website perpustakaan dari sisi admin dan siswa.

## Persiapan
- Pastikan backend berjalan di `http://localhost:3000`.
- Pastikan frontend berjalan di `http://localhost:5173`.
- Buka browser ke `http://localhost:5173`.

## Login
1. Buka halaman login.
2. Masukkan NISN atau email, password, dan OTP (jika 2FA aktif untuk admin).
3. Klik Login.

Catatan:
- Admin default: `admin@library.com` dengan password dari `ADMIN_PASSWORD`.
- Siswa hasil import: login pakai NISN (atau email `nisn@student.local`) dan password sesuai kolom `nama_orangtua`.

## Navigasi utama (setelah login)
- Beranda: ringkasan akses cepat.
- Buku: katalog buku dan aksi pinjam/reservasi.
- Peminjaman: daftar peminjaman, return, dan preview buku digital.
- Reservasi: antrean reservasi buku fisik.
- Notifikasi: pengingat due date dan status reservasi.
- Menu Admin (khusus admin): Kategori, Tambah Buku, Log Audit, Siswa, Impor Siswa, Keamanan, Laporan.

## Alur untuk Siswa

### 1) Melihat katalog buku
1. Buka menu Buku.
2. Gunakan Search, Category, dan Sort untuk filter.
3. Klik Borrow untuk meminjam buku.
4. Jika stok buku fisik habis, tombol berubah menjadi Reserve untuk antrean.

Catatan:
- Akun return_only hanya bisa mengembalikan buku.
- Akun nonaktif tidak bisa meminjam.

### 2) Meminjam buku
1. Di menu Buku, klik Borrow pada buku yang tersedia.
2. Sistem membuat peminjaman selama 7 hari.
3. Buku digital bisa dipreview dari menu Peminjaman.

### 3) Reservasi buku fisik
1. Pilih buku fisik yang stoknya habis.
2. Klik Reserve untuk masuk antrean.
3. Saat status READY, buku harus segera dipinjam sebelum masa hold berakhir.

### 4) Melihat dan mengembalikan peminjaman
1. Buka menu Peminjaman.
2. Filter berdasarkan status atau tanggal jika perlu.
3. Klik Return untuk mengembalikan.
4. Jika buku digital, gunakan tombol Preview untuk membuka PDF.

### 5) Melihat reservasi
1. Buka menu Reservasi.
2. Lihat status: ACTIVE, READY, FULFILLED, CANCELLED, EXPIRED.
3. Klik Batalkan jika ingin membatalkan reservasi yang masih ACTIVE atau READY.

### 6) Notifikasi
1. Buka menu Notifikasi.
2. Baca pengingat due date, overdue, atau reservasi siap.
3. Klik Tandai untuk menandai notifikasi sebagai sudah dibaca.

## Alur untuk Admin

### 1) Kelola kategori
1. Buka menu Kategori.
2. Isi nama kategori lalu klik Create.
3. Hapus kategori dari daftar jika tidak digunakan.

### 2) Tambah buku (fisik)
1. Buka menu Tambah Buku.
2. Isi Title, Author, ISBN, Year, Stock, Category.
3. Upload cover (opsional).
4. Klik Create Book.

### 3) Tambah buku digital (PDF)
1. Buka menu Tambah Buku.
2. Pilih Format = Digital (PDF).
3. Isi Title, Author, ISBN, Year, Category.
4. Upload file PDF dan cover (opsional).
5. Klik Create Book.

### 4) Edit buku
1. Buka menu Buku.
2. Klik Edit pada buku yang ingin diubah.
3. Simpan perubahan.

### 5) Hapus buku
1. Buka menu Buku.
2. Klik Delete pada buku yang dipilih.
3. Konfirmasi penghapusan.

Catatan:
- Buku yang sedang dipinjam tidak bisa dihapus.

### 6) Impor akun siswa
1. Buka menu Impor Siswa.
2. Siapkan file Excel (.xlsx/.xls) dengan kolom: `nisn`, `nama`, `kelas`, `nama_orangtua`.
3. Upload file, klik Import.
4. Sistem menampilkan hasil import dan error jika ada.

### 7) Kelola data siswa
1. Buka menu Siswa.
2. Gunakan Search dan Status filter.
3. Klik Nonaktifkan untuk menonaktifkan akun siswa aktif.

Catatan:
- Akun kelas 6 otomatis berubah ke return_only pada 5 Juli.
- Akun return_only akan dihapus di akhir Agustus (otomasi sistem).

### 8) Audit log
1. Buka menu Log Audit.
2. Filter berdasarkan action, entity, atau user ID.
3. Ekspor data ke CSV/XLSX jika diperlukan.

### 9) Laporan
1. Buka menu Laporan.
2. Lihat ringkasan total buku, siswa, peminjaman aktif, overdue, reservasi aktif, dan total denda.
3. Lihat tren peminjaman dan buku terpopuler.

### 10) Keamanan (2FA Admin)
1. Buka menu Keamanan.
2. Klik Setup 2FA untuk mendapatkan secret.
3. Masukkan secret ke aplikasi authenticator (Google Authenticator / Authy).
4. Masukkan OTP lalu klik Aktifkan.
5. Untuk menonaktifkan, masukkan OTP lalu klik Nonaktifkan.

## Ekspor data
Ekspor tersedia di halaman:
- Buku
- Peminjaman
- Siswa
- Log Audit

Format yang tersedia: `CSV` dan `XLSX`.

