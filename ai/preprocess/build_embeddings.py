from pathlib import Path
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import os
import shutil

# Path setup
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "ai" / "data" / "data pangan bersih.parquet"
EMB_PATH = BASE_DIR / "ai" / "data" / "build_embeddings.npy"
INDEX_PATH = BASE_DIR / "ai" / "data" / "build_index.faiss"

# MODEL BARU QWEN3
MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"

def main():
    print(f"\nMembaca data dari: {DATA_PATH}")
    
    if not os.path.exists(DATA_PATH):
        print("❌ ERROR: File parquet tidak ditemukan.")
        return

    # Hapus file lama biar bersih
    if os.path.exists(EMB_PATH): os.remove(EMB_PATH)
    if os.path.exists(INDEX_PATH): os.remove(INDEX_PATH)

    df = pd.read_parquet(DATA_PATH)
    texts = df["food_text"].astype(str).tolist()

    print(f"Loading Model {MODEL_NAME}...")
    # Qwen3 usually safe with trust_remote_code=True
    model = SentenceTransformer(MODEL_NAME, trust_remote_code=True)
    
    print(f"Generating Embeddings for {len(texts)} items...")
    # Note: Dokumen database TIDAK perlu prompt "query", biarkan default
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)

    print(f"Dimensi Model Baru: {embeddings.shape[1]}") # Cek dimensi (biasanya 1024)

    # Simpan .npy
    EMB_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.save(EMB_PATH, embeddings)
    print(f"Saved embeddings: {EMB_PATH}")

    # Buat Index FAISS
    print("Membangun index FAISS...")
    d = embeddings.shape[1]
    index = faiss.IndexFlatIP(d) 
    
    faiss.normalize_L2(embeddings)
    index.add(embeddings)
    
    faiss.write_index(index, str(INDEX_PATH))
    print(f"Saved FAISS index: {INDEX_PATH}")

if __name__ == "__main__":
    main()