import google.generativeai as genai
import os
import json

def generate_food_candidates(query_text):
    # Prompt yang lebih spesifik agar menghapus angka/satuan
    prompt = f"""
    Tugas: Ekstrak nama makanan inti dari input user, buang jumlah/satuan, lalu cari nama generik bakunya di Indonesia.
    
    User Input: "{query_text}"
    
    Aturan:
    1. HAPUS angka dan satuan (misal: "2 porsi", "setengah mangkok", "500 gram").
    2. Jika input "2 porsi nasi goreng", ambil "nasi goreng".
    3. Output HARUS JSON Array berisi 3 string.
    
    Contoh: 
    Input: "2 porsi nasi goreng ayam" -> Output: ["nasi goreng ayam", "nasi goreng", "nasi goreng spesial"]
    Input: "jus alpukat" -> Output: ["jus alpukat", "alpukat", "es alpukat"]

    JSON Output:
    """
    
    model_list = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro']

    for model_name in model_list:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            text_resp = response.text.strip()
            
            if text_resp.startswith("```"):
                text_resp = text_resp.strip("```json").strip("```").strip()
            
            candidates = json.loads(text_resp)
            if isinstance(candidates, list):
                # Jangan append query_text asli kalau mengandung angka!
                # Kita percaya hasil LLM saja yang sudah bersih.
                return candidates 
            
        except Exception as e:
            print(f"⚠️ Model {model_name} error: {e}")
            continue

    # Fallback darurat: Kembalikan input asli (apa boleh buat)
    print("❌ Semua LLM Gagal. Menggunakan input asli.")
    return [query_text]