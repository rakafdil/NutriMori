import sys
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv  # Import library pembaca .env

# Import module buatanmu
from ai.core.llm_helper import generate_food_candidates
from ai.core.matcher import FoodMatcher
from ai.core.nutrition import NutritionCalculator

# --- 1. SETUP ENV & KEY ---
# Load environment variables dari file .env
load_dotenv()

# Ambil API Key secara aman
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("❌ API Key tidak ditemukan! Pastikan file .env sudah dibuat.")

genai.configure(api_key=API_KEY)

# --- 2. INISIALISASI ---
print("Loading AI Models...")
matcher = FoodMatcher()
calculator = NutritionCalculator()
print("System Ready!")

def process_smart_food_logging(user_query, jumlah=1, satuan="porsi"):
    try:
        # 1. LLM
        candidates = generate_food_candidates(user_query)

        # 2. Matcher
        search_results = matcher.match_with_llm_candidates(candidates, top_final=5)
        
        if not search_results:
            return {"success": False, "message": "Makanan tidak ditemukan."}

        # 3. Nutrisi
        raw_nutrisi = calculator.get_nutrition_smart(search_results, jumlah, satuan)
        
        # 4. Formatting Output
        output_data = {
            "nama_makanan": raw_nutrisi.get('nama_pilihan', 'Unknown'),
            "porsi_display": f"{jumlah} {satuan}",
            "berat_gram": round(raw_nutrisi.get('gram', 0), 1)
        }
        
        exclude_keys = ['nama_pilihan', 'gram', 'metode', 'nama', 'food_id']
        for key, val in raw_nutrisi.items():
            if key not in exclude_keys:
                try:
                    output_data[key] = round(float(val), 1)
                except:
                    pass

        return {
            "success": True,
            "data": output_data,
            "metadata": {
                "logic_used": raw_nutrisi.get('metode'),
                "confidence_score": round(search_results[0]['similarity'], 2),
                "matched_db_name": search_results[0]['nama']
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

# Test Run
if __name__ == "__main__":
    print("--- Running Test ---")
    # Ini inputan makanannya
    result = process_smart_food_logging("Ayam KFC", 1, "potong")
    print(json.dumps(result, indent=4))