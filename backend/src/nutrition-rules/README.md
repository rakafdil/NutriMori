# Nutrition Rules Service

Deskripsi singkat
- Service CRUD untuk aturan nutrisi (`nutrition_rules`) dan utilitas untuk memeriksa pelanggaran nutrisi pada kumpulan nilai nutrisi.
- Digunakan oleh modul lain untuk memberikan peringatan/rekomendasi berdasarkan rule-based checks.

Fitur utama
- Create / Read / Update / Delete rules pada tabel `nutrition_rules`.
- `checkNutrients(nutrients)` — validasi nilai nutrisi terhadap semua rule dan mengembalikan daftar pelanggaran.

Lokasi service
- File utama: `nutrition-rules.service.ts` (backend/src/nutrition-rules)

Dependensi
- `SupabaseService` — akses DB Supabase.
- DTOs: `CreateNutritionRuleDto`, `UpdateNutritionRuleDto`.

Skema tabel (kolom penting)
- `nutrition_rules` (contoh kolom):
  - `id`
  - `rule_name`
  - `description`
  - `nutrient` (mis. `protein`, `calories`)
  - `min_value` (nullable)
  - `max_value` (nullable)
  - `severity` (`critical` | `warning` | `suggestion`)
  - `created_at`, `updated_at`

API / Method penting
- `create(createDto)` — menambahkan rule baru.
- `findAll(options?)` — ambil semua rule, optional filter by nutrient/severity.
- `findOne(id)` — ambil rule per ID (lempar NotFound jika tidak ada).
- `findByNutrient(nutrient)` — ambil rules untuk nutrient tertentu.
- `update(id, updateDto)` — update rule; validasi keberadaan terlebih dahulu.
- `remove(id)` — hapus rule.
- `checkNutrients(nutrients: Record<string, number>)` — periksa semua rules dan kembalikan object berisi `violations`, `hasViolations`, `criticalCount`, `warningCount`, `suggestionCount`.

Contoh `checkNutrients` (pseudocode)
- Input: `{ protein: 40, sodium: 1200, calories: 2500 }`
- Output:
  - `violations`: array dengan detail rule, nilai aktual, dan jenis pelanggaran (`below_min` | `above_max`).
  - counts untuk severity.

Integrasi dan penggunaan
- Service ini dapat dipanggil sebelum menyimpan atau menampilkan analisis nutrisi untuk menandai peringatan.
- Pastikan tabel `nutrition_rules` sudah dimigrasi dan berisi rule awal bila diperlukan.

Catatan tambahan
- `checkNutrients` mengabaikan rule jika nutrient tidak ada pada input.
- Nilai min/max di-cast ke `Number` sebelum perbandingan.

Contoh pemanggilan (pseudocode)
- `nutritionRulesService.checkNutrients({ calories: 2200, protein: 55 })`

