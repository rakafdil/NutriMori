# Habit Insights Service

Deskripsi singkat
- Service ini menghasilkan insight kebiasaan makan pengguna berdasarkan data `nutrition_analysis` (pre-computed) dan `food_logs`.
- Menggabungkan rule-based pattern detection, perhitungan skor kesehatan lokal, dan AI (Gemini) untuk ringkasan & rekomendasi.

Fitur utama
- Agregasi data harian dari `nutrition_analysis`.
- Deteksi pola makan (via `PatternDetector`).
- Perhitungan `healthScore` (via `HealthScoreCalculator`).
- Ringkasan & rekomendasi AI (via `GeminiClient`).
- Caching hasil analisis (via `CacheManager`) dan invalidation.
- Historis skor kesehatan per bulan.

Lokasi service
- File utama: `habit-insights.service.ts` (backend/src/habit-insights)

Dependensi penting
- `SupabaseService` — akses database Supabase.
- `ConfigService` — membaca env vars seperti `GEMINI_API_KEY`.
- Internal helpers: `CacheManager`, `DataAggregator`, `PatternDetector`, `HealthScoreCalculator`, `GeminiClient`.

Tabel/kolom DB yang digunakan
- `nutrition_analysis` (join ke `food_logs`) — digunakan sebagai sumber data nutrisi per log.
- `food_logs` — untuk tanggal/meal_type dari catatan makanan.
- `habit_insights_cache` — menyimpan hasil analisis yang telah di-generate.
- `users` — untuk mendapatkan profil user (age, weight_kg, height_cm).
- `dataset_akg` (alias AKG) — untuk target nutrisi berdasarkan usia.

Konfigurasi
- Env var: `GEMINI_API_KEY` — API key untuk Gemini (jika AI summary diinginkan).

Cara kerja ringkas
1. `generateInsight(params)`
   - Hitung date range berdasarkan `period` (WEEKLY / MONTHLY / YEARLY / OVERALL) atau `startDate`/`endDate` jika diberikan.
   - Fetch data dari `nutrition_analysis` (filter di-memory berdasarkan `food_logs.created_at`).
   - Aggregate per-hari (`DataAggregator.aggregateFromNutritionAnalysis`).
   - Periksa cache berdasarkan hash data; kembalikan cached response jika tersedia.
   - Ambil user targets (AKG / default), deteksi pola, hitung health score.
   - Panggil AI (`GeminiClient.generateInsights`) untuk summary & rekomendasi.
   - Simpan ke cache dan kembalikan `HabitInsightResponseDto`.

2. `invalidateCache(userId, period?)`
   - Hapus entri cache dari `habit_insights_cache` untuk user (opsional: per period).

3. `getHealthScoreHistory(userId, months)`
   - Menghasilkan skor per bulan berdasarkan data `nutrition_analysis` untuk rentang bulan yang diminta.

Tips integrasi
- Pastikan `SupabaseService` terkonfigurasi di module NestJS.
- Jika tidak menggunakan AI, `GEMINI_API_KEY` bisa dikosongkan; service tetap menghitung `healthScore` lokal.
- Untuk debugging, perhatikan log peringatan jika aggregasi atau tanggal bermasalah.

Contoh pemanggilan (pseudocode)
- `habitInsightsService.generateInsight({ userId: '...', period: 'WEEKLY' })`

Catatan
- Date handling menggunakan ISO date strings (YYYY-MM-DD) dan memperhitungkan seluruh hari akhir (23:59:59) saat mengambil range.
- Fungsi-fungsi utilitarian (`DataAggregator`, `PatternDetector`, dll.) berada di folder `helpers` terkait; README ini fokus pada integrasi dan penggunaan service.
