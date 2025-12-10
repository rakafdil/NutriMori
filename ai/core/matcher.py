import numpy as np
import os
import json
from pathlib import Path

# Cek mode: gunakan Supabase atau Local
USE_SUPABASE = os.environ.get("USE_SUPABASE", "0") == "1"

def parse_embedding(emb):
    """Parse embedding dari berbagai format (string, list, dll) ke numpy array."""
    if emb is None:
        return None
    
    # Sudah numpy array
    if isinstance(emb, np.ndarray):
        return emb.astype("float32")
    
    # Sudah list of floats
    if isinstance(emb, list):
        return np.array(emb, dtype="float32")
    
    # String - perlu di-parse
    if isinstance(emb, str):
        # Hapus whitespace
        emb = emb.strip()
        
        # Format: [0.1, 0.2, ...] atau (0.1, 0.2, ...)
        if emb.startswith('[') or emb.startswith('('):
            try:
                parsed = json.loads(emb.replace('(', '[').replace(')', ']'))
                return np.array(parsed, dtype="float32")
            except json.JSONDecodeError:
                pass
        
        # Format: 0.1,0.2,0.3,... (comma separated)
        try:
            values = [float(x.strip()) for x in emb.split(',') if x.strip()]
            return np.array(values, dtype="float32")
        except ValueError:
            pass
    
    return None


class FoodMatcher:
    def __init__(self):
        if USE_SUPABASE:
            # Mode Supabase: Ambil data dari DB, tapi tetap pakai embedding model
            print("🌐 FoodMatcher: Mode SUPABASE (with embedding model)")
            self._init_supabase_with_model()
        else:
            # Mode Local: Load dari file lokal
            print("💻 FoodMatcher: Mode LOCAL (with embedding model)")
            self._init_local()

    def _init_supabase_with_model(self):
        """
        Ambil data dari Supabase, tapi tetap pakai SentenceTransformer + FAISS.
        Embedding di-load dari Supabase dan di-build jadi FAISS index di memory.
        """
        import faiss
        from sentence_transformers import SentenceTransformer
        from core.supabase_client import supabase
        
        self.supabase = supabase
        
        # Load model untuk query embedding
        print("  ⏳ Loading SentenceTransformer model...")
        self.model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        
        # Fetch semua data dari Supabase
        print("  ⏳ Fetching food data from Supabase...")
        
        # Fetch dengan pagination karena mungkin data banyak
        all_foods = []
        page_size = 1000
        offset = 0
        
        while True:
            result = supabase.table("food_embeddings")\
                .select("food_id, nama, embedding, nutrition_data")\
                .order("food_id")\
                .range(offset, offset + page_size - 1)\
                .execute()
            
            if not result.data:
                break
                
            all_foods.extend(result.data)
            print(f"    Fetched {len(all_foods)} records...")
            
            if len(result.data) < page_size:
                break
            offset += page_size
        
        if not all_foods:
            raise RuntimeError("❌ Tidak ada data di tabel food_embeddings!")
        
        self.foods = all_foods
        print(f"  ✅ Loaded {len(self.foods)} foods from Supabase")
        
        # Build FAISS index dari embeddings
        print("  ⏳ Building FAISS index...")
        embeddings = []
        valid_foods = []
        
        for food in self.foods:
            emb = parse_embedding(food.get("embedding"))
            if emb is not None and len(emb) > 0:
                embeddings.append(emb)
                valid_foods.append(food)
        
        if not embeddings:
            raise RuntimeError("❌ Tidak ada embedding valid di database!")
        
        # Update foods hanya yang punya embedding valid
        self.foods = valid_foods
        
        self.emb = np.vstack(embeddings)
        faiss.normalize_L2(self.emb)
        
        dim = self.emb.shape[1]
        self.index = faiss.IndexFlatIP(dim)  # Inner Product (cosine setelah normalize)
        self.index.add(self.emb)
        print(f"  ✅ FAISS index ready ({self.index.ntotal} vectors, dim={dim})")

    def _init_local(self):
        """Inisialisasi dengan file lokal + model embedding."""
        import pandas as pd
        import faiss
        from sentence_transformers import SentenceTransformer

        BASE_DIR = Path(__file__).resolve().parent.parent
        DATA_DIR = BASE_DIR / "data"

        self.df = pd.read_parquet(DATA_DIR / "data pangan bersih.parquet")
        self.emb = np.load(DATA_DIR / "build_embeddings.npy")
        self.index = faiss.read_index(str(DATA_DIR / "build_index.faiss"))
        self.model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        self.supabase = None
        self.foods = None

    def embed(self, text):
        """Embed text menggunakan SentenceTransformer."""
        if self.model is None:
            raise RuntimeError("Model tidak di-load")
        return self.model.encode([text], convert_to_numpy=True)[0]

    def _search_single_local(self, text, k=5):
        """Pencarian dengan FAISS lokal (file-based)."""
        import faiss
        q_emb = self.embed(text).astype("float32").reshape(1, -1)
        faiss.normalize_L2(q_emb)
        D, I = self.index.search(q_emb, k)
        
        results = []
        for idx, sim in zip(I[0], D[0]):
            if idx == -1:
                continue
            row = self.df.iloc[idx]
            results.append({
                "food_id": int(idx),
                "nama": row["Nama Bahan Makanan"],
                "nama_clean": row.get("nama_clean", ""),
                "similarity": float(sim)
            })
        return results

    def _search_single_supabase(self, text, k=5):
        """Pencarian dengan FAISS (data dari Supabase)."""
        import faiss
        q_emb = self.embed(text).astype("float32").reshape(1, -1)
        faiss.normalize_L2(q_emb)
        D, I = self.index.search(q_emb, k)
        
        results = []
        for idx, sim in zip(I[0], D[0]):
            if idx == -1 or idx >= len(self.foods):
                continue
            food = self.foods[idx]
            results.append({
                "food_id": food.get("food_id", idx),
                "nama": food.get("nama", ""),
                "nama_clean": food.get("nama", ""),
                "similarity": float(sim),
                "nutrition_data": food.get("nutrition_data", {})
            })
        return results

    def _search_single(self, text, k=5):
        """Router: pilih metode pencarian sesuai mode."""
        if USE_SUPABASE:
            return self._search_single_supabase(text, k)
        else:
            return self._search_single_local(text, k)

    def match_with_llm_candidates(self, candidates, top_final=5):
        """Match kandidat LLM ke database makanan."""
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