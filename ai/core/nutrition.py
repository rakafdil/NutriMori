import pandas as pd
from pathlib import Path
import os
from .portion import portion_to_gram

class NutritionCalculator:
    def __init__(self):
        # DETEKSI OTOMATIS PATH
        if os.path.exists("/content/NutriMori/ai/data/data pangan bersih.parquet"):
             DATA_PATH = Path("/content/NutriMori/ai/data/data pangan bersih.parquet")
        else:
             DATA_PATH = Path("/content/ai/data/data pangan bersih.parquet")

        self.df = pd.read_parquet(DATA_PATH)
        # Gunakan list kolom nutrisi lengkap sesuai kebutuhanmu
        self.nutr_cols = ["Energi", "Protein", "Lemak", "Karbohidrat", "Serat", "Air", "Kalsium", "Besi"] 
        for c in self.nutr_cols:
            if c in self.df.columns: self.df[c] = self.df[c].fillna(0.0)

    def get_nutrition_smart(self, match_results, jumlah=1, satuan="porsi"):
        if not match_results: return None
        top = match_results[0]
        
        if top["similarity"] >= 0.90:
            row = self.df.iloc[top["food_id"]]
            gram = portion_to_gram(jumlah, satuan, row.get("nama_clean"))
            res = {"gram": gram, "nama_pilihan": row["Nama Bahan Makanan"], "metode": "exact"}
            for c in self.nutr_cols: res[c] = float(row.get(c,0)) * (gram/100)
            return res
        else:
            cands = match_results[:3]
            gram = portion_to_gram(jumlah, satuan, top.get("nama_clean"))
            acc = {c: 0.0 for c in self.nutr_cols}
            valid = 0
            names = []
            for item in cands:
                row = self.df.iloc[item["food_id"]]
                names.append(row["Nama Bahan Makanan"])
                for c in self.nutr_cols: acc[c] += float(row.get(c,0))
                valid += 1
            
            res = {"gram": gram, "nama_pilihan": "Mix: " + ", ".join(names[:2]), "metode": "average"}
            if valid > 0:
                for c in self.nutr_cols: res[c] = (acc[c]/valid) * (gram/100)
            return res