import pandas as pd
from pathlib import Path
from .portion import portion_to_gram

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "ai" / "data" / "data pangan bersih.parquet"

class NutritionCalculator:
    def __init__(self):
        self.df = pd.read_parquet(DATA_PATH)
        
        # Mengisi nilai NaN dengan 0 agar perhitungan tidak error/None
        # (Opsional: aktifkan jika ingin hasil penjumlahan selalu ada angkanya)
        # numeric_cols = self.df.select_dtypes(include=['float64', 'int64']).columns
        # self.df[numeric_cols] = self.df[numeric_cols].fillna(0)

        # DAFTAR LENGKAP (21 Nutrisi)
        self.nutr_cols = [
            # Makro Utama
            "Energi", "Protein", "Lemak", "Karbohidrat", "Serat", "Air",
            
            # Mineral
            "Kalsium", "Fosfor", "Besi", "Natrium", "Kalium", 
            "Tembaga", "Seng", "Abu",
            
            # Vitamin
            "Vitamin C", "Vitamin B1", "Vitamin B2", "Niasin",
            "Retinol", "Beta-karoten", "Karoten total"
        ]

    def get_food_nutrition(self, food_id, jumlah=1, satuan="porsi"):
        # Pastikan food_id valid
        if food_id < 0 or food_id >= len(self.df):
            return None

        row = self.df.iloc[food_id]
        
        # Hitung berat dalam gram
        gram = portion_to_gram(jumlah, satuan, row["nama_clean"])
        
        # Faktor pengali (data nutrisi per 100g)
        # Kita perhitungkan juga BDD (Berat Dapat Dimakan) jika ada datanya
        bdd_factor = 1.0
        if "BDD" in row and pd.notna(row["BDD"]):
             # BDD di dataset biasanya dalam persen (contoh: 80.0 artinya 80%)
             # Tapi jika hitungan 'portion_to_gram' sudah berasumsi "berat bersih siap makan",
             # maka BDD tidak perlu dikalikan lagi. 
             # ASUMSI: 'gram' adalah berat makanan yang akan dimakan langsung.
             pass 

        faktor = gram / 100.0
        
        result = {
            "nama": row["Nama Bahan Makanan"],
            "gram": gram,
        }

        for col in self.nutr_cols:
            # Ambil nilai, jika kosong/NaN anggap None (atau 0 tergantung selera)
            val = row.get(col)
            if pd.notna(val):
                result[col] = float(val) * faktor
            else:
                result[col] = 0.0 # Atau ganti 0.0 jika ingin rapi

        return result

    def calculate_daily(self, food_items):
        total = {col: 0.0 for col in self.nutr_cols}
        details = []

        for item in food_items:
            info = self.get_food_nutrition(
                item["food_id"],
                item.get("jumlah", 1),
                item.get("satuan", "porsi"),
            )
            
            if info:
                details.append(info)
                for col in self.nutr_cols:
                    if info[col] is not None:
                        total[col] += info[col]

        return {
            "total": total,
            "details": details,
        }