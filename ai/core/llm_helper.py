import google.generativeai as genai
import json
import os
import time
import random

# Pastikan API KEY sudah diset
# os.environ["GOOGLE_API_KEY"] = "MASUKKAN_API_KEY_ANDA"
# genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

def generate_food_candidates(query_text):
    # Prompt yang lebih spesifik agar menghapus angka/satuan
    prompt = f"""
    Bertindaklah sebagai ahli database nutrisi (TKPI & USDA). 
    Tugasmu adalah memetakan input makanan user menjadi 3 kandidat nama baku yang ada di database komposisi pangan.
    
    ATURAN PENAMAAN (PENTING):
    1. Gunakan format "Bahan Utama, detail spesifik, metode pengolahan".
    2. Tiru gaya database resmi seperti gambar referensi: "Keju, cheddar", "Mentega, asin", "Daging ayam, dada, mentah".
    3. Prioritaskan istilah dalam Bahasa Indonesia baku (TKPI), jika tidak ada gunakan terjemahan baku USDA.
    
    User Input: "{query_text}"
    
    Output HANYA berupa JSON Array of Strings.
    Contoh Output yang benar: ["Daging ayam, dada, goreng", "Ayam, daging, paha, panggang", "Daging ayam, olahan, nugget"]
    """
    
    # Update daftar model (hapus model yang sudah deprecated/tidak stabil)
    model_list = [
        "models/gemini-flash-latest",   # Versi stabil Flash
        "models/gemini-pro-latest",     # Versi stabil Pro (Coba ini!)
        "models/gemini-2.0-flash-lite", # Ringan
        "models/gemini-2.0-flash",      # Canggih
    ]

    for model_name in model_list:
        try:
            time.sleep(0.5 + random.random())
            print(f"Mencoba model: {model_name}...") # Debugging log
            
            # FITUR BARU: Menggunakan response_mime_type untuk memaksa output JSON
            # Ini didukung di google-generativeai >= 0.5.0
            model = genai.GenerativeModel(
                model_name,
                generation_config={"response_mime_type": "application/json"}
            )
            
            response = model.generate_content(prompt)
            text_resp = response.text.strip()
            
            # Parsing JSON
            candidates = json.loads(text_resp)
            if isinstance(candidates, list):
                # Sukses! Kembalikan hasil bersih (tanpa append input asli yang ada angkanya)
                return candidates
            
        except Exception:
            # Silent Fail: Jika error (429/404), langsung coba model berikutnya tanpa print berisik
            continue 

    # --- FALLBACK MANUAL ---
    # Jika semua AI mati/limit, kita split manual sederhana
    if " dan " in query_text:
        return query_text.split(" dan ")
        
    # Kembalikan input asli sebagai jalan terakhir
    return [query_text]