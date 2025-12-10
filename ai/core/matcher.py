import numpy as np
import os
import json
from pathlib import Path

# Check deploy mode BEFORE importing heavy libs
IS_VERCEL = os.environ.get("VERCEL", "0") == "1"
USE_SUPABASE = IS_VERCEL or os.environ.get("USE_SUPABASE", "0") == "1"

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
        self.use_supabase = USE_SUPABASE
        self.model = None  # Lazy load
        self.supabase = None
        self.index = None
        self.foods = None
        self.df = None
        self._model_loaded = False
        
        if self.use_supabase:
            print("☁️ Using Supabase vector search (optimized mode)")
            self._init_supabase_client()
        else:
            print("💻 Using local FAISS index")
            self._init_local()

    def _get_model(self):
        """Lazy load model only when needed."""
        if not self._model_loaded:
            print("  ⏳ Loading SentenceTransformer model (lazy)...")
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            )
            self._model_loaded = True
            print("  ✅ Model loaded!")
        return self.model

    def _init_supabase_client(self):
        """Initialize Supabase client only - NO data fetching."""
        from supabase import create_client
        
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            raise RuntimeError("❌ SUPABASE_URL or SUPABASE_KEY not set!")
        
        self.supabase = create_client(url, key)
        print("  ✅ Supabase client ready")

    def _init_local(self):
        """Inisialisasi dengan file lokal + model embedding."""
        import pandas as pd
        import faiss

        BASE_DIR = Path(__file__).resolve().parent.parent
        DATA_DIR = BASE_DIR / "data"

        self.df = pd.read_parquet(DATA_DIR / "data pangan bersih.parquet")
        self.emb = np.load(DATA_DIR / "build_embeddings.npy")
        self.index = faiss.read_index(str(DATA_DIR / "build_index.faiss"))
        self.supabase = None
        self.foods = None

    def embed(self, text):
        """Embed text menggunakan SentenceTransformer (lazy loaded)."""
        model = self._get_model()
        return model.encode([text], convert_to_numpy=True)[0]

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
        """
        Pencarian dengan Supabase pgvector - server-side similarity search.
        Hanya kirim query embedding, biarkan PostgreSQL yang cari.
        """
        # Generate embedding for query
        q_emb = self.embed(text).astype("float32")
        
        # Normalize for cosine similarity
        norm = np.linalg.norm(q_emb)
        if norm > 0:
            q_emb = q_emb / norm
        
        # Convert to list for JSON
        embedding_list = q_emb.tolist()
        
        try:
            # Call Supabase RPC function for vector search
            result = self.supabase.rpc(
                'match_foods',
                {
                    'query_embedding': embedding_list,
                    'match_count': k,
                    'match_threshold': 0.3  # Minimum similarity
                }
            ).execute()
            
            if result.data:
                return [
                    {
                        "food_id": item.get("food_id", 0),
                        "nama": item.get("nama", ""),
                        "nama_clean": item.get("nama", ""),
                        "similarity": float(item.get("similarity", 0)),
                        "nutrition_data": item.get("nutrition_data", {})
                    }
                    for item in result.data
                ]
            return []
            
        except Exception as e:
            print(f"❌ Supabase vector search error: {e}")
            # Fallback to text search
            return self._fallback_text_search(text, k)

    def _fallback_text_search(self, text, k=5):
        """Fallback: simple text search if vector search fails."""
        try:
            result = self.supabase.table("food_embeddings")\
                .select("food_id, nama, nutrition_data")\
                .ilike("nama", f"%{text}%")\
                .limit(k)\
                .execute()
            
            return [
                {
                    "food_id": item.get("food_id", 0),
                    "nama": item.get("nama", ""),
                    "nama_clean": item.get("nama", ""),
                    "similarity": 0.5,  # Default score for text match
                    "nutrition_data": item.get("nutrition_data", {})
                }
                for item in (result.data or [])
            ]
        except Exception as e:
            print(f"❌ Fallback text search error: {e}")
            return []

    def _search_single(self, text, k=5):
        """Router: pilih metode pencarian sesuai mode."""
        if self.use_supabase:
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