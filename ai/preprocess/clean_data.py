import pandas as pd
import unicodedata
from pathlib import Path
import os

# ==============================================================================
# KONFIGURASI PATH (SESUAIKAN NAMA FILE KAMU)
# ==============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent.parent # Folder Root 'NutriMori'

# Ganti nama file ini sesuai nama file hasil download terakhirmu (500 item)
INPUT_FILENAME = "dataset_gabungan.csv" 

RAW_PATH = BASE_DIR / "ai" / "data raw" / INPUT_FILENAME
OUT_PATH = BASE_DIR / "ai" / "data" / "data pangan bersih.parquet"

def normalize_name(name: str) -> str:
    """Membersihkan nama makanan untuk pencarian AI (lowercase, no simbol aneh)."""
    if not isinstance(name, str):
        return ""
    name = name.lower().strip()
    name = unicodedata.normalize("NFKD", name)
    # Hapus simbol-simbol supaya bersih saat dicari
    for ch in [",", ".", "(", ")", ":", ";", "/", "\\", "-", "’", "'", '"']:
        name = name.replace(ch, " ")
    return " ".join(name.split())

def build_food_text(row):
    """
    Format teks spesial untuk dibaca AI (Embedding).
    Contoh output: "nasi goreng kambing | kelompok sereal & olahan | bentuk olahan"
    """
    parts = [str(row["nama_clean"])]

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
        print(f"👉 Pastikan file '{INPUT_FILENAME}' sudah ada di folder 'ai/data raw/'")
        return

    df = pd.read_csv(RAW_PATH)
    print(f"📊 Total baris awal: {len(df)}")

    # ---------------------------------------------------------
    # TAHAP 1: PEMBERSIHAN DATA NUMERIK (SAFETY NET)
    # ---------------------------------------------------------
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
            # Ganti koma dengan titik (format desimal Indonesia)
            if df[col].dtype == 'object':
                 df[col] = df[col].astype(str).str.replace(',', '.', regex=False)
            
            # Paksa jadi angka, error jadi 0
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
        else:
            # Jika kolom tidak ada, buat baru isi 0 (biar code tidak error)
            df[col] = 0.0

    # ---------------------------------------------------------
    # TAHAP 2: PERSIAPAN KOLOM AI (NORMALISASI & EMBEDDING TEXT)
    # ---------------------------------------------------------
    print("🤖 Menyiapkan kolom untuk AI (food_text)...")
    
    # 1. Buat nama bersih (lowercase)
    df["nama_clean"] = df["Nama Bahan Makanan"].apply(normalize_name)
    
    # 2. Buat teks gabungan untuk embedding
    df["food_text"] = df.apply(build_food_text, axis=1)

    # 3. (Opsional) Hapus duplikat persis jika ada sisa
    before_dedup = len(df)
    df = df.drop_duplicates(subset=['nama_clean'], keep='first')
    if len(df) < before_dedup:
        print(f"🧹 Membersihkan {before_dedup - len(df)} duplikat identik.")

    # ---------------------------------------------------------
    # TAHAP 3: SIMPAN KE PARQUET
    # ---------------------------------------------------------
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUT_PATH, index=False)

    print("\n" + "="*50)
    print(f"✅ SUKSES! Data siap pakai untuk AI.")
    print(f"📁 Lokasi: {OUT_PATH}")
    print(f"📊 Total Data: {len(df)} item")
    print("="*50)

if __name__ == "__main__":
    main()