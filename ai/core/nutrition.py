import pandas as pd
import numpy as np
from pathlib import Path
from .portion import portion_to_gram

class NutritionCalculator:
    def __init__(self):
        BASE_DIR = Path(__file__).resolve().parent.parent
        DATA_PATH = BASE_DIR / "data" / "data pangan bersih.parquet"

        self.df = pd.read_parquet(DATA_PATH)
        
        # Ambil semua kolom numerik otomatis
        all_numeric = self.df.select_dtypes(include=[np.number]).columns.tolist()
        exclude = ['No', 'id', 'food_id', 'similarity'] 
        
        self.nutr_cols = [c for c in all_numeric if c not in exclude]
        self.df[self.nutr_cols] = self.df[self.nutr_cols].fillna(0.0)

    def get_nutrition_smart(self, match_results, jumlah=1, satuan="porsi"):
        if not match_results: return None
        
        top = match_results[0]
        nama_ref = top.get("nama_clean") if top["similarity"] >= 0.90 else match_results[0].get("nama_clean")
        gram = portion_to_gram(jumlah, satuan, nama_ref)
        
        final_nutrisi = {"gram": gram}

        if top["similarity"] >= 0.90:
            row = self.df.iloc[top["food_id"]]
            final_nutrisi["nama_pilihan"] = row["Nama Bahan Makanan"]
            final_nutrisi["metode"] = "exact_match"
            
            for col in self.nutr_cols:
                final_nutrisi[col] = float(row.get(col, 0.0)) * (gram / 100.0)
        else:
            cands = match_results[:3]
            acc = {c: 0.0 for c in self.nutr_cols}
            names = []
            valid = 0
            
            for item in cands:
                row = self.df.iloc[item["food_id"]]
                names.append(row["Nama Bahan Makanan"])
                for col in self.nutr_cols:
                    acc[col] += float(row.get(col, 0.0))
                valid += 1
            
            final_nutrisi["nama_pilihan"] = "Mix: " + ", ".join(names[:2])
            final_nutrisi["metode"] = "average"
            
            if valid > 0:
                for col in self.nutr_cols:
                    final_nutrisi[col] = (acc[col] / valid) * (gram / 100.0)

        return final_nutrisi