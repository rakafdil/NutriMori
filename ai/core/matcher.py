import pandas as pd
import numpy as np
import faiss
from pathlib import Path
from sentence_transformers import SentenceTransformer

class FoodMatcher:
    def __init__(self):
        ROOT = Path.cwd()
        DATA_DIR = ROOT / "ai" / "data"

        self.df = pd.read_parquet(DATA_DIR / "data pangan bersih.parquet")
        self.emb = np.load(DATA_DIR / "build_embeddings.npy")
        self.index = faiss.read_index(str(DATA_DIR / "build_index.faiss"))

        # Initialize model
        self.model = SentenceTransformer(
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )

        # Pastikan dimension cocok
        assert self.emb.shape[1] == self.index.d

    def embed(self, text):
        return self.model.encode([text], convert_to_numpy=True)[0]

    def match(self, query, k=5):
        # --- FIXED INDENTATION ---
        # embed query
        q_emb = self.embed(query).astype("float32").reshape(1, -1)

        # normalisasi
        faiss.normalize_L2(q_emb)

        # search vector
        distances, indices = self.index.search(q_emb, k)
        sims = distances[0]  # cosine similarity

        results = []
        for idx, sim in zip(indices[0], sims):
            row = self.df.iloc[idx]
            results.append({
                "index": int(idx),
                "nama": row["Nama Bahan Makanan"],
                "nama_clean": row["nama_clean"],
                "food_text": row["food_text"],
                "similarity": float(sim),
            })

        return results