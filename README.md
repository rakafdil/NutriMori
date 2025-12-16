# 🥗 NutriMori

[Demo Website](https://nutri-mori.vercel.app)

NutriMori adalah aplikasi **nutrition tracking cerdas** yang dirancang khusus untuk konteks makanan Indonesia. Aplikasi ini membantu pengguna memahami apa yang mereka makan, berapa kebutuhan gizinya, dan apa pilihan terbaik untuk hari ini — semuanya berbasis data, histori konsumsi, dan dukungan AI.

Bukan sekadar pencatat kalori. NutriMori memadukan **data nutrisi lokal**, **analisis kebiasaan makan**, dan **mesin rekomendasi adaptif** agar keputusan makan jadi lebih sadar, realistis, dan berkelanjutan.

---

## ✨ Fitur Utama

* Perhitungan nutrisi per makanan dan ringkasan harian (kalori, makro, hingga mikronutrien).
* **Batasan nutrisi personal (nutrition limits)** yang disesuaikan dengan profil pengguna.
* Dukungan **AI untuk personalisasi**, dengan fallback rumus **Mifflin–St Jeor** saat AI tidak tersedia.
* Rekomendasi harian (daily recommendations) berbasis histori konsumsi dan preferensi.
* Dashboard analytics untuk memantau tren makan dan progres tujuan kesehatan.
* Sistem database dengan migrasi terstruktur dan mudah dikembangkan.
* Postman collection untuk testing dan eksplorasi API.

---

## 🧠 Sumber Data Nutrisi

NutriMori dibangun di atas dataset makanan Indonesia agar hasil analisis tetap relevan dengan pola makan lokal.

Kontribusi dataset utama:

* **Andrafarm.com**
  Digunakan sebagai referensi data nutrisi bahan pangan dan makanan khas Indonesia.

* **Kaggle – Indonesian Food and Drink Nutrition Dataset**
  [https://www.kaggle.com/datasets/anasfikrihanif/indonesian-food-and-drink-nutrition-dataset](https://www.kaggle.com/datasets/anasfikrihanif/indonesian-food-and-drink-nutrition-dataset)
  Menyediakan data terstruktur nutrisi makanan dan minuman Indonesia yang digunakan untuk pemodelan dan validasi.

Dataset ini diproses dan disesuaikan (cleaning & normalisasi) agar konsisten dengan sistem perhitungan NutriMori.

---

## 🏗️ Arsitektur & Alur Sistem (Ringkas)

NutriMori adalah aplikasi **full‑stack TypeScript** dengan pemisahan tanggung jawab yang jelas agar scalable dan maintainable.

**Frontend (Presentation Layer)**

* Dibangun dengan React / Next.js berbasis TypeScript.
* Menangani UI, food logging, dashboard analytics, dan visualisasi data.
* Dideploy menggunakan Vercel.

**Backend API**

* Menggunakan pola **Controller → Service → DTO**.
* Menyediakan endpoint untuk:

  * Kalkulasi nutrition limits
  * Manajemen food log
  * Rekomendasi harian
  * Data analytics
* Mendukung validasi data dan pengujian via Postman.

**Database & Storage**

* Database relasional (PostgreSQL).
* Mendukung migrasi skema agar mudah dikembangkan.
* Integrasi Supabase untuk fitur tertentu (realtime / rekomendasi).

**AI & Layanan Eksternal**

* Integrasi layanan AI (Gemini) untuk personalisasi kebutuhan nutrisi.
* Fallback otomatis ke rumus **Mifflin–St Jeor** jika AI gagal.

**Diagram singkat (teks)**

```
Frontend (Vercel)
   ↕
Backend API (TypeScript)
   ↕
Database (Postgres / Supabase)
   ↘
    AI Service (Gemini)
    Fallback: Mifflin–St Jeor
```

---

## 🚀 Mengapa Pendekatan Ini Masuk Akal

* Pemisahan frontend & backend memungkinkan pengembangan paralel.
* Pola Controller/Service/DTO memudahkan testing dan scaling.
* AI memberi nilai tambah tanpa mengorbankan reliabilitas (karena ada fallback).
* Dataset lokal membuat rekomendasi lebih relevan dibanding data global generik.

---

## 🛠️ Tech Stack

* **Language**: TypeScript
* **Frontend**: Next.js / React
* **Backend**: Node.js (arsitektur modular)
* **Database**: PostgreSQL + Supabase
* **AI**: Gemini AI
* **Deployment**: Vercel (Frontend)
* **API Testing**: Postman

---

## 🔄 Contoh Alur Sistem (Kalkulasi Nutrition Limits)

1. Pengguna mengisi profil (umur, tinggi, berat, gender, preferensi).
2. Frontend mengirim request ke `POST /nutrition-limits/calculate`.
3. Backend:

   * Memanggil Gemini AI untuk perhitungan personal, atau
   * Menggunakan Mifflin–St Jeor jika AI tidak tersedia.
4. Hasil disimpan di tabel `nutrition_limits`.
5. Dashboard menampilkan batas nutrisi dan rekomendasi harian.

---

## ▶️ Menjalankan Proyek Secara Lokal

1. Clone repository:

   ```bash
   git clone https://github.com/rakafdil/NutriMori.git
   ```
2. Install dependencies:

   ```bash
   cd NutriMori
   npm install / pnpm install / yarn
   ```
3. Siapkan environment variables (DB, AI_KEY, SUPABASE_URL, dll).
4. Jalankan migrasi database sesuai tool yang digunakan.
5. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

---

## 🧪 Dokumentasi & Testing

* Postman collection tersedia untuk menguji endpoint utama.
* DTO dan validasi memastikan integritas data selama pengembangan.

---

## 🤝 Kontribusi

Kontribusi sangat terbuka.

1. Fork repository
2. Buat branch fitur
3. Ajukan Pull Request dengan deskripsi yang jelas dan cara pengujian

---

## 📄 Lisensi

MIT License — lihat file LICENSE untuk detail.

---

Catatan:
Dokumentasi ini dapat dikembangkan lebih lanjut (diagram ER, sequence diagram, panduan deploy backend, atau dokumentasi API detail) sesuai kebutuhan proyek.
