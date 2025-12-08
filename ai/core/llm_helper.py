import google.generativeai as genai
import os
import json

# --- PERBAIKAN DI SINI ---
# Masukkan API Key langsung sebagai string (jangan lupa tanda kutip)
MY_API_KEY = "AIzaSyDaTX-AxNEV8dAZ3vflCWZd3BRudhD9_aQ" # <- Ganti dengan key asli kamu jika ini salah
genai.configure(api_key=MY_API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

def generate_food_candidates(query_text):
    """
    Menggunakan LLM untuk mencari nama makanan generik dari input user.
    """
    prompt = f"""
    Kamu adalah ahli gizi. Tugasmu adalah menerjemahkan nama makanan brand/spesifik menjadi nama makanan generik yang mungkin ada di database komposisi pangan Indonesia.
    
    User Input: "{query_text}"
    
    Berikan output HANYA berupa JSON Array of Strings berisi 3-4 nama kandidat makanan generik yang paling mirip komposisinya. Jangan ada markdown lain.
    Contoh output: ["nama 1", "nama 2", "nama 3"]
    """
    
    try:
        response = model.generate_content(prompt)
        text_resp = response.text.strip()
        
        # Bersihkan jika ada backticks markdown
        if text_resp.startswith("```"):
            text_resp = text_resp.strip("```json").strip("```").strip()
            
        candidates = json.loads(text_resp)
        
        # Pastikan return list
        if isinstance(candidates, list):
            candidates.append(query_text) 
            return candidates
        else:
            return [query_text]
            
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback: jika LLM error, kembalikan input user saja
        return [query_text]