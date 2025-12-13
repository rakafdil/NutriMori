# Referensi Ilmiah Metode Perhitungan Nutrisi

Dokumen ini merangkum dasar ilmiah yang digunakan dalam *Nutrition Analysis Service* dengan fokus pada referensi akademik dan standar resmi yang menjadi landasan setiap metode perhitungan nutrisi di dalam kode.

---

## 1. Perhitungan Energi Total (Kalori)

### Metode

Energi total dihitung menggunakan faktor Atwater umum:

* Protein: 4 kkal per gram
* Karbohidrat: 4 kkal per gram
* Lemak: 9 kkal per gram

Metode ini digunakan dalam fungsi `calculateTotalNutrition` dan `calculateMacroRatio`.

### Referensi

**FAO / INFOODS – Atwater General Factors**

> “The energy content of foods is commonly calculated using general Atwater factors: protein 4 kcal/g, fat 9 kcal/g, and carbohydrate 4 kcal/g.”

Sumber:

* FAO/INFOODS Guidelines for Food Matching
  [https://www.fao.org/fileadmin/templates/food_composition/documents/Nutrition_assessment/INFOODSGuidelinesforFoodMatching_version_1_2.pdf](https://www.fao.org/fileadmin/templates/food_composition/documents/Nutrition_assessment/INFOODSGuidelinesforFoodMatching_version_1_2.pdf)

---

## 2. Perhitungan Makronutrien dan Rasio Energi

### Metode

Kontribusi energi dari protein, karbohidrat, dan lemak dihitung sebagai persentase dari total energi harian melalui fungsi `calculateMacroRatio`.

### Referensi

**WHO / FAO – Macronutrient Distribution Ranges**

> “A healthy diet should derive approximately 55–75% of energy from carbohydrates, 15–30% from fat, and 10–15% from protein.”

Sumber:

* WHO/FAO Dietary Guidelines (TRS 916)
  [https://www.who.int/publications/i/item/924120916X](https://www.who.int/publications/i/item/924120916X)

---

## 3. Perhitungan Mikronutrien Berdasarkan AKG

### Metode

Perhitungan mikronutrien dilakukan dengan langkah berikut:

1. Menghitung total asupan mikronutrien berdasarkan nilai per 100 gram.
2. Menyesuaikan dengan jumlah konsumsi aktual.
3. Membandingkan hasil dengan Angka Kecukupan Gizi (AKG) berdasarkan kelompok umur dan jenis kelamin.
4. Menyajikan hasil dalam bentuk persentase kebutuhan harian.

### Referensi

**Angka Kecukupan Gizi Indonesia – Permenkes No. 28 Tahun 2019**

> “Angka Kecukupan Gizi adalah tingkat kecukupan rata-rata zat gizi yang dianjurkan untuk dikonsumsi per hari bagi hampir semua orang sehat menurut kelompok umur dan jenis kelamin.”

Sumber:

* Peraturan Menteri Kesehatan RI Nomor 28 Tahun 2019
  [https://peraturan.bpk.go.id/Download/129886/Permenkes%20Nomor%2028%20Tahun%202019.pdf](https://peraturan.bpk.go.id/Download/129886/Permenkes%20Nomor%2028%20Tahun%202019.pdf)

---

## 4. Estimasi Asupan Nutrisi dari Food Log

### Metode

Asupan nutrisi diestimasi menggunakan pendekatan *dietary record* dengan karakteristik:

* pencatatan makanan (food log),
* penggunaan tabel komposisi pangan,
* perhitungan berbasis berat konsumsi (gram-based),
* penjumlahan total asupan per hari atau per makanan.

### Referensi

**Henríquez-Sánchez et al., British Journal of Nutrition**

> “Dietary records and 24-hour recalls are valid methods for estimating macro- and micronutrient intake when food composition tables are used.”

DOI: 10.1017/S0007114509993126

Sumber PDF:

* [https://www.cambridge.org/core/journals/british-journal-of-nutrition/article/dietary-assessment-methods-for-micronutrient-intake-a-systematic-review-on-vitamins/15B21FF470B6C7A260B4F8B959EFE1DB](https://www.cambridge.org/core/journals/british-journal-of-nutrition/article/dietary-assessment-methods-for-micronutrient-intake-a-systematic-review-on-vitamins/15B21FF470B6C7A260B4F8B959EFE1DB)

---

## 5. Estimasi Gula pada Data Tidak Lengkap

### Metode

Apabila data gula tidak tersedia dalam database pangan:

* nilai gula diestimasi sebagai proporsi dari total karbohidrat,
* hasil estimasi ditandai secara eksplisit melalui flag `sugar_estimated`.

### Referensi

**FAO – Handling Missing Nutrient Data**

> “When nutrient data are missing, imputation or estimation methods may be used, provided they are clearly identified and documented.”

Sumber:

* FAO Food Composition Data Guidelines
  [https://www.fao.org/infoods/infoods/standards-guidelines/en/](https://www.fao.org/infoods/infoods/standards-guidelines/en/)

---

## 6. Evaluasi Asupan terhadap Batas Kesehatan

### Metode

Evaluasi kesehatan dilakukan dengan:

* membandingkan asupan zat gizi dengan AKG,
* mengidentifikasi nilai yang melebihi atau mendekati batas,
* menghasilkan *health warnings* dan *tags* untuk natrium, gula, dan serat.

### Referensi

**WHO – Guideline on Sodium and Sugar Intake**

> “Adults should limit sodium intake to less than 2,000 mg per day and free sugars to less than 10% of total energy intake.”

Sumber:

* WHO Sodium Intake Guideline
  [https://www.who.int/publications/i/item/9789241504836](https://www.who.int/publications/i/item/9789241504836)
* WHO Sugar Intake Guideline
  [https://www.who.int/publications/i/item/9789241549028](https://www.who.int/publications/i/item/9789241549028)

---

## Ringkasan

Metode perhitungan nutrisi dalam sistem ini dibangun berdasarkan:

* faktor energi Atwater (FAO),
* distribusi makronutrien WHO/FAO,
* Angka Kecukupan Gizi resmi Indonesia,
* metodologi dietary assessment yang digunakan dalam penelitian gizi internasional.

Seluruh referensi dicantumkan untuk memastikan keterlacakan ilmiah dan konsistensi metodologis.