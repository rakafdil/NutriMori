import google.generativeai as genai
import os
import json

def generate_food_candidates(query_text):
    prompt = f"""
    Kamu adalah ahli gizi. Tugasmu adalah menerjemahkan nama makanan brand/spesifik menjadi nama makanan generik baku Indonesia.
    User Input: "{query_text}"
    Berikan output HANYA berupa JSON Array of Strings berisi 3 nama kandidat makanan generik yang paling mirip komposisinya. 
    Contoh: ["ayam goreng tepung", "dada ayam goreng", "ayam krispi"]
    """
    
    # Daftar prioritas model
    model_list = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.0-pro',
        'gemini-pro'
    ]

    for model_name in model_list:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            
            text_resp = response.text.strip()
            
            if text_resp.startswith("```"):
                text_resp = text_resp.strip("```json").strip("```").strip()
            
            candidates = json.loads(text_resp)
            
            if isinstance(candidates, list):
                candidates.append(query_text) 
                return candidates
            
        except Exception:
            continue

    # Fallback jika semua model gagal
    return [query_text]