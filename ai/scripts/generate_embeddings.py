"""
Script untuk generate embedding dari Parquet dan simpan ke Supabase.
Menggantikan penyimpanan lokal FAISS dengan database Vector Supabase.
"""

import sys
import os
import json
import pandas as pd
from pathlib import Path
from sentence_transformers import SentenceTransformer
from supabase import create_client
from dotenv import load_dotenv

# --- 1. Konfigurasi Path & Environment ---
# Menyesuaikan dengan struktur folder Script 2
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "ai" / "data" / "data pangan bersih.parquet"
ENV_PATH = BASE_DIR / ".env"  # Asumsi file .env ada di root project

# Load Environment Variables
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") # Gunakan Service Key (bukan Anon) untuk write access

# Validasi Env
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(f"❌ Error: SUPABASE_URL dan SUPABASE_SERVICE_KEY tidak ditemukan di {ENV_PATH}")

# Inisialisasi Client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

def main():
    print(f"\n📂 Membaca data dari: {DATA_PATH}")
    
    if not os.path.exists(DATA_PATH):
        print("❌ ERROR: File parquet tidak ditemukan.")
        return

    # Load Data
    df = pd.read_parquet(DATA_PATH)
    
    # Pastikan data bersih (hapus NaN di kolom teks jika ada)
    df = df.dropna(subset=['food_text'])
    texts = df["food_text"].astype(str).tolist()

    print(f"📊 Total data makanan: {len(df)}")
    print(f"🔄 Sedang membuat embeddings menggunakan {MODEL_NAME}...")
    
    # Generate Embeddings
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(texts, show_progress_bar=True)

    # --- 2. Upload ke Supabase ---
    print("\n☁️  Mulai upload ke Supabase (tabel: food_embeddings)...")
    
    batch_size = 100
    total_uploaded = 0
    
    # Loop batching
    for i in range(0, len(df), batch_size):
        batch = []
        end_idx = min(i + batch_size, len(df))
        
        for j in range(i, end_idx):
            row = df.iloc[j]
            
            # Sanitasi data row agar kompatibel dengan JSON (mengubah NaN menjadi None/null)
            row_dict = row.where(pd.notnull(row), None).to_dict()
            
            # Persiapkan payload sesuai schema tabel Supabase Anda
            # Note: Sesuaikan 'nama' dengan nama kolom yang ada di parquet Anda (misal: 'nama_bahan' atau 'food_text')
            payload = {
                "food_id": int(j),  # Atau gunakan ID dari kolom data jika ada
                "nama": row_dict.get('nama', row_dict.get('food_text', 'Unknown')), 
                "embedding": embeddings[j].tolist(),
                "nutrition_data": row_dict
            }
            batch.append(payload)
        
        try:
            # Upsert (Insert or Update) ke tabel
            supabase.table("food_embeddings").upsert(batch).execute()
            total_uploaded += len(batch)
            print(f"   ✅ Uploaded batch {i}-{end_idx} ({total_uploaded}/{len(df)})")
        except Exception as e:
            print(f"   ❌ Gagal upload batch {i}-{end_idx}: {e}")

    print("\n🎉 SELESAI! Semua embedding telah tersimpan di Supabase.")

if __name__ == "__main__":
    main()