import pandas as pd
import numpy as np
import faiss
from pathlib import Path
from sentence_transformers import SentenceTransformer

class FoodMatcher:
    def __init__(self):
        # Path relatif: ai/core/ -> ai/ -> ai/data
        BASE_DIR = Path(__file__).resolve().parent.parent
        DATA_DIR = BASE_DIR / "data"

        self.df = pd.read_parquet(DATA_DIR / "data pangan bersih.parquet")
        self.emb = np.load(DATA_DIR / "build_embeddings.npy")
        self.index = faiss.read_index(str(DATA_DIR / "build_index.faiss"))

        self.model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

    def embed(self, text):
        return self.model.encode([text], convert_to_numpy=True)[0]

    def _search_single(self, text, k=5):
        q_emb = self.embed(text).astype("float32").reshape(1, -1)
        faiss.normalize_L2(q_emb)
        D, I = self.index.search(q_emb, k)
        
        results = []
        for idx, sim in zip(I[0], D[0]):
            if idx == -1: continue
            row = self.df.iloc[idx]
            results.append({
                "food_id": int(idx),
                "nama": row["Nama Bahan Makanan"],
                "nama_clean": row.get("nama_clean", ""),
                "similarity": float(sim)
            })
        return results

    def match_with_llm_candidates(self, candidates, top_final=5):
        aggregated = []
        seen = set()
        
        for c in candidates:
            res = self._search_single(c, k=3)
            for item in res:
                if item["food_id"] not in seen:
                    aggregated.append(item)
                    seen.add(item["food_id"])
                    
        aggregated = sorted(aggregated, key=lambda x: x["similarity"], reverse=True)
        return aggregated[:top_final]