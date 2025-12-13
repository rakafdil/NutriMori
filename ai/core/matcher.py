import numpy as np
import os
import json
from pathlib import Path

# Cek Mode Deploy (Vercel/Supabase)
IS_VERCEL = os.environ.get("VERCEL", "0") == "1"
USE_SUPABASE = IS_VERCEL or os.environ.get("USE_SUPABASE", "0") == "1"

def parse_embedding(emb):
    """
    Helper untuk mengubah string/list embedding menjadi numpy array float32.
    Berguna jika data dari database/CSV terbaca sebagai string.
    """
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
        self.df = None
        self._model_loaded = False
        
        if self.use_supabase:
            print("☁️ Using Supabase vector search")
            self._init_supabase_client()
        else:
            print("💻 Using local FAISS index")
            self._init_local()

    def _get_model(self):
        """Lazy load model Qwen3."""
        if not self._model_loaded:
            print("  ⏳ Loading Qwen3 Model...")
            from sentence_transformers import SentenceTransformer
            
            # --- UPDATE KHUSUS QWEN3 ---
            self.model = SentenceTransformer(
                "Qwen/Qwen3-Embedding-0.6B",
                trust_remote_code=True # Wajib untuk arsitektur Qwen
            )
            self._model_loaded = True
            print("  ✅ Model loaded!")
        return self.model

    def _init_supabase_client(self):
        """Inisialisasi koneksi Supabase."""
        from supabase import create_client
        
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            raise RuntimeError("❌ SUPABASE_URL or SUPABASE_KEY not set in .env!")
        
        self.supabase = create_client(url, key)
        print("  ✅ Supabase client ready")

    def _init_local(self):
        """Inisialisasi FAISS Lokal."""
        import pandas as pd
        import faiss

        BASE_DIR = Path(__file__).resolve().parent.parent
        DATA_DIR = BASE_DIR / "data"

        if not os.path.exists(DATA_DIR / "data pangan bersih.parquet"):
             raise FileNotFoundError("❌ Database belum dibuat! Jalankan 'build_embeddings.py' dulu.")

        self.df = pd.read_parquet(DATA_DIR / "data pangan bersih.parquet")
        self.emb = np.load(DATA_DIR / "build_embeddings.npy")
        self.index = faiss.read_index(str(DATA_DIR / "build_index.faiss"))

    def embed(self, text):
        """
        Embed text menggunakan Qwen3.
        PENTING: Qwen3 butuh instruksi 'prompt_name="query"' untuk input user.
        """
        model = self._get_model()
        return model.encode([text], prompt_name="query", convert_to_numpy=True)[0]

    def _search_single_supabase(self, text, k=5):
        """
        Search via Supabase RPC.
        """
        q_emb = self.embed(text).astype("float32")
        
        # Normalisasi L2 (untuk Cosine Similarity)
        norm = np.linalg.norm(q_emb)
        if norm > 0:
            q_emb = q_emb / norm
        
        embedding_list = q_emb.tolist()
        
        try:
            result = self.supabase.rpc(
                'match_foods',
                {
                    'query_embedding': embedding_list,
                    'match_count': k,
                    'match_threshold': 0.3 
                }
            ).execute()
            
            if result.data:
                return [
                    {
                        "food_id": item.get("food_id", 0),
                        "nama": item.get("nama", ""),
                        "nama_clean": item.get("nama_clean", ""),
                        "similarity": float(item.get("similarity", 0)),
                        "nutrition_data": item.get("nutrition_data", {})
                    }
                    for item in result.data
                ]
            return []
            
        except Exception as e:
            print(f"❌ Supabase Search Error: {e}")
            return []

    def _search_single_local(self, text, k=5):
        """Search via Local FAISS."""
        q_emb = self.embed(text).astype("float32").reshape(1, -1)
        
        import faiss
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

    def _search_single(self, text, k=5):
        """Router: Pilih Cloud atau Local."""
        if self.use_supabase:
            return self._search_single_supabase(text, k)
        else:
            return self._search_single_local(text, k)

    def match_with_llm_candidates(self, candidates, top_final=5):
        aggregated = []
        seen = set()
        
        for c in candidates:
            res = self._search_single(c)
            for item in res:
                if item["food_id"] not in seen:
                    aggregated.append(item)
                    seen.add(item["food_id"])
                    
        aggregated = sorted(aggregated, key=lambda x: x["similarity"], reverse=True)
        return aggregated[:top_final]