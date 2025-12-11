# scripts/upload_embeddings.py
from supabase import create_client
import numpy as np
import csv
import os
from sentence_transformers import SentenceTransformer

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

model = SentenceTransformer("all-MiniLM-L6-v2")  # contoh ringan
rows = []
with open("data raw/dataset_gabungan.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        name = r.get("nama") or r.get("name") or r.get("food_name")
        if not name: continue
        emb = model.encode(name).tolist()
        rows.append({
            "food_id": r.get("id") or r.get("food_id") or name,
            "name": name,
            "metadata": r,
            "embedding": emb
        })

# Upsert in batches
for i in range(0, len(rows), 100):
    batch = rows[i:i+100]
    res = sb.table("foods").insert(batch).execute()
    print("Inserted", res.status_code, res.data)