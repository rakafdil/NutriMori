# 🥗 NutriMori

[Demo Website](https://nutri-mori.vercel.app)

**NutriMori** adalah *Website Pencatat Log Makanan Pintar Berbasis Analisis Nutrisi* yang dirancang untuk membantu mahasiswa dan masyarakat umum memahami asupan gizi harian mereka secara ilmiah, terukur, dan relevan dengan pola makan Indonesia.

Aplikasi ini dikembangkan sebagai solusi atas rendahnya pemahaman nutrisi makanan sehari-hari serta keterbatasan fitur aplikasi kesehatan yang ada saat ini.

---

## 👥 Tim Pengembang

* **Dzaky Rezandi** : AI Engineer
* **Very Fachrurozi** : Back-End Developer
* **Muhammad Raka Fadillah** : Front=End Developer & Product Manager

---

## 🧩 Pernyataan Masalah

Berdasarkan penelitian Wulandari et al. (2020), tingkat pengetahuan gizi memiliki hubungan signifikan dengan status gizi mahasiswa. Namun pada praktiknya:

* Pengguna kesulitan memahami kandungan nutrisi makanan sehari-hari.
* Informasi gizi sering tersebar, tidak kontekstual, atau tidak sesuai makanan lokal.
* Aplikasi yang ada memiliki fitur terbatas dan kurang personal.

NutriMori hadir untuk menjembatani kesenjangan tersebut melalui pendekatan berbasis data dan analisis nutrisi ilmiah.

---

## 💡 Solusi yang Ditawarkan

NutriMori menyediakan sistem pencatatan dan analisis makanan yang:

* Mudah digunakan
* Berbasis dataset nutrisi Indonesia
* Memberikan rekomendasi yang adaptif dan personal

---

## ✨ Fitur Inti

* Profil pengguna dan kalkulator kebutuhan kalori serta makronutrien.
* Pencarian makanan dengan informasi gizi lengkap per item.
* Pencatatan asupan makanan harian (food log).
* Rekomendasi makanan sehat berbasis analisis nutrisi.
* Filter alergi dan preferensi diet (vegan, rendah karbohidrat, bebas gluten, dll).
* Grafik progres (berat badan, kalori, makro) dan ringkasan mingguan.
* Antarmuka responsif dengan dukungan mode gelap.

---

## 🧠 Dataset & Sumber Data

NutriMori menggunakan dataset nutrisi yang relevan dan tervalidasi untuk konteks Indonesia:

1. **TKPI & USDA (Andrafarm)**
   Daftar Kandungan Gizi Bahan Makanan Indonesia dan USDA.
   [https://www.andrafarm.com/_andra.php?_i=daftar-tkpi](https://www.andrafarm.com/_andra.php?_i=daftar-tkpi)
   [https://www.andrafarm.com/_andra.php?_i=daftar-usda](https://www.andrafarm.com/_andra.php?_i=daftar-usda)

2. **Indonesian Food and Drink Nutrition Dataset (Kaggle)**
   [https://www.kaggle.com/datasets/anasfikrihanif/indonesian-food-and-drink-nutrition-dataset](https://www.kaggle.com/datasets/anasfikrihanif/indonesian-food-and-drink-nutrition-dataset)

Dataset diproses melalui tahap *cleaning*, normalisasi satuan, dan pemetaan agar konsisten dengan sistem analisis NutriMori.

---

## 🧮 Dasar Perhitungan Nutrisi

Perhitungan nutrisi dalam NutriMori mengacu pada standar internasional dan nasional:

### 1. Energi Total (Kalori)

Dihitung menggunakan **faktor Atwater**:

* Protein: 4 kkal/g
* Karbohidrat: 4 kkal/g
* Lemak: 9 kkal/g
  (Sesuai standar FAO/INFOODS)

### 2. Distribusi Makronutrien

Mengacu pada rekomendasi **WHO/FAO**:

* Karbohidrat: 55–75%
* Lemak: 15–30%
* Protein: 10–15%

### 3. Mikronutrien (AKG)

Asupan dibandingkan dengan **Angka Kecukupan Gizi (AKG) Indonesia** berdasarkan umur dan jenis kelamin.

### 4. Estimasi Food Log

Menggunakan metode **dietary record** berbasis tabel komposisi pangan yang tervalidasi secara ilmiah.

### 5. Estimasi Gula

Jika data gula tidak tersedia, nilai diestimasi dari total karbohidrat dan ditandai secara eksplisit.

### 6. Evaluasi Batas Kesehatan

Asupan dibandingkan dengan batas WHO untuk:

* Natrium
* Gula

Untuk menghasilkan peringatan kesehatan.

Referensi WHO:
[https://www.who.int/publications/i/item/9789241549028](https://www.who.int/publications/i/item/9789241549028)

---

## 🏗️ Arsitektur Teknis

### Models & Architecture

* **LLM**: Google Gemini (Flash Latest, Pro Latest, 2.0 Flash Lite)
* **Embedding Model**: Qwen3-0.6B

### Tech Stack

* **Frontend**: Next.js (TypeScript)
* **Backend**: NestJS & Flask (API)
* **Database**: PostgreSQL (Supabase)
* **Deployment**:

  * Frontend: Vercel
  * AI Service: HuggingFace

---

## 🔗 Demo & Repository

* Demo Website: [https://nutri-mori.vercel.app](https://nutri-mori.vercel.app)
* GitHub Repository: [https://github.com/rakafdil/NutriMori](https://github.com/rakafdil/NutriMori)

---

## 📚 Dokumentasi Teknis Lanjutan

Penjelasan detail modul analisis nutrisi:
[https://github.com/rakafdil/NutriMori/blob/main/backend/src/nutrition-analysis/README.md](https://github.com/rakafdil/NutriMori/blob/main/backend/src/nutrition-analysis/README.md)

---

## 📄 Lisensi

MIT License — lihat file LICENSE untuk detail.
