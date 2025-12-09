from pathlib import Path
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import os

# Konfigurasi Path Dinamis
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "ai" / "data" / "data pangan bersih.parquet"
EMB_PATH = BASE_DIR / "ai" / "data" / "build_embeddings.npy"
INDEX_PATH = BASE_DIR / "ai" / "data" / "build_index.faiss"

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

def main():
    print(f"\n Membaca data dari: {DATA_PATH}")
    
    if not os.path.exists(DATA_PATH):
        print("❌ ERROR: File parquet tidak ditemukan. Jalankan 'clean_data.py' dulu!")
        return

    df = pd.read_parquet(DATA_PATH)
    texts = df["food_text"].astype(str).tolist()

    print(f"🔄 Sedang membuat embeddings untuk {len(texts)} data makanan...")
    print("   (Ini mungkin memakan waktu agak lama tergantung CPU/GPU)...")
    
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)

    # Simpan Embeddings (.npy)
    EMB_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.save(EMB_PATH, embeddings)
    print(f"Saved embeddings: {EMB_PATH}")

    # Buat Index FAISS
    print("Membangun index FAISS...")
    d = embeddings.shape[1]
    index = faiss.IndexFlatIP(d) # Inner Product (karena akan dinormalisasi jadi Cosine)
    
    faiss.normalize_L2(embeddings)
    index.add(embeddings)
    
    faiss.write_index(index, str(INDEX_PATH))
    print(f"Saved FAISS index: {INDEX_PATH}")
    print("\nSELESAI! Database AI berhasil di-update.")

if __name__ == "__main__":
    main()