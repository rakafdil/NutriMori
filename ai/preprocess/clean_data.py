import pandas as pd
import unicodedata
from pathlib import Path
import os
import sys

# Konfigurasi Path Dinamis (VS Code Friendly)
BASE_DIR = Path(__file__).resolve().parent.parent.parent # Folder Root 'NutriMori'
RAW_PATH = BASE_DIR / "ai" / "data raw" / "dataset_gabungan.csv"
OUT_PATH = BASE_DIR / "ai" / "data" / "data pangan bersih.parquet"

def normalize_name(name: str) -> str:
    """Membersihkan nama makanan dari karakter aneh dan spasi berlebih."""
    if not isinstance(name, str):
        return ""
    name = name.lower().strip()
    name = unicodedata.normalize("NFKD", name)
    for ch in [",", ".", "(", ")", ":", ";", "/", "\\", "-", "’", "'", '"']:
        name = name.replace(ch, " ")
    name = " ".join(name.split())
    return name

def build_food_text(row):
    """Format teks untuk embedding."""
    parts = [row["nama_clean"]]

    kelompok = str(row.get("Kelompok Makanan", ""))
    if kelompok.lower() not in ["-", "nan", "none", "", "0"]:
        parts.append(f"kelompok {kelompok.lower()}")

    bentuk = str(row.get("Mentah/Olahan", ""))
    if bentuk.lower() not in ["-", "nan", "none", "", "0"]:
        parts.append(f"bentuk {bentuk.lower()}")

    return " | ".join(parts)

def main():
    print(f"\n📂 Sedang memuat data dari: {RAW_PATH}")

    if not os.path.exists(RAW_PATH):
        print(f"❌ ERROR: File tidak ditemukan di: {RAW_PATH}")
        print("Pastikan kamu sudah menaruh file 'dataset_gabungan.csv' di folder 'ai/data raw/'")
        return

    df = pd.read_csv(RAW_PATH)

    # Daftar Kolom Numerik (Wajib sama dengan datasetmu)
    numeric_cols = [
        "Energi", "Protein", "Lemak Total", "Karbohidrat", "Gula", "Serat",
        "Kalsium", "Fosfor", "Besi", "Magnesium", "Kalium", "Natrium", "Seng", "Tembaga",
        "Vitamin C", "Vitamin B1", "Vitamin B2", "Vitamin B3", "Vitamin B6",
        "Vitamin B9", "Vitamin B12", "Vitamin A", "Vitamin D", "Vitamin E", "Vitamin K",
        "Lemak Jenuh", "Lemak Tunggal", "Lemak Ganda", "Kolesterol"
    ]

    print("🔄 Membersihkan data numerik...")
    for col in numeric_cols:
        if col in df.columns:
            # Ganti koma dengan titik (jika ada format desimal Indonesia 12,5 -> 12.5)
            if df[col].dtype == 'object':
                 df[col] = df[col].astype(str).str.replace(',', '.', regex=False)
            
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
        else:
            print(f"⚠️ Warning: Kolom '{col}' tidak ada di CSV. Diisi 0.")
            df[col] = 0.0

    print("🔄 Membersihkan nama makanan...")
    df["nama_clean"] = df["Nama Bahan Makanan"].apply(normalize_name)
    df["food_text"] = df.apply(build_food_text, axis=1)

    # Simpan
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUT_PATH, index=False)

    print("\n" + "="*50)
    print(f"SUKSES! File bersih tersimpan di:\n{OUT_PATH}")
    print("="*50)

if __name__ == "__main__":
    main()