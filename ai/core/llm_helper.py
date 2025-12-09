import google.generativeai as genai
import json
import os

# Pastikan API KEY sudah diset
# os.environ["GOOGLE_API_KEY"] = "MASUKKAN_API_KEY_ANDA"
# genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

def generate_food_candidates(query_text):
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
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro' # Model lama tapi stabil
    ]

    for model_name in model_list:
        try:
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
                candidates.append(query_text) # Tambahkan query asli sebagai fallback terakhir
                return candidates
            
        except Exception as e:
            # JANGAN return str(e) di sini, karena akan mematikan loop.
            # Print error saja, lalu biarkan loop lanjut ke model berikutnya.
            print(f"Gagal dengan model {model_name}: {e}")
            continue 

    # Fallback jika SEMUA model gagal
    print("Semua model gagal, menggunakan fallback default.")
    return [query_text]