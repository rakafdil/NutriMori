"""
Supabase client untuk akses database.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load env
load_dotenv(Path(__file__).parent.parent.parent / '.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

supabase = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✅ Supabase connected: {SUPABASE_URL[:30]}...")
    except Exception as e:
        print(f"❌ Supabase connection error: {e}")
else:
    print("⚠️ Supabase credentials not found in .env")


def search_foods_by_vector(embedding: list, top_k: int = 5, threshold: float = 0.3) -> list:
    """Vector similarity search using pgvector."""
    if not supabase:
        return []
    
    try:
        result = supabase.rpc(
            'match_foods',
            {
                'query_embedding': embedding,
                'match_count': top_k,
                'match_threshold': threshold
            }
        ).execute()
        return result.data or []
    except Exception as e:
        print(f"❌ Supabase vector search error: {e}")
        return []


def search_foods_by_text(query: str, top_k: int = 5) -> list:
    """Fallback: text search tanpa vector."""
    if not supabase:
        return []
    
    try:
        result = supabase.rpc(
            'match_foods_by_text',
            {'query_text': query, 'match_count': top_k}
        ).execute()
        return result.data or []
    except Exception as e:
        print(f"❌ Supabase search error: {e}")
        return []


def get_food_by_name(name: str) -> dict:
    """Cari exact/partial match tanpa vector."""
    if not supabase:
        return {}
    
    try:
        result = supabase.table("food_embeddings")\
            .select("*")\
            .ilike("nama", f"%{name}%")\
            .limit(1)\
            .execute()
        
        if result.data:
            return result.data[0]
        return {}
    except Exception as e:
        print(f"❌ Supabase get error: {e}")
        return {}