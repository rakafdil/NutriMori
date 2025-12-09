import google.generativeai as genai
import json
import os

# Pastikan API KEY sudah diset
# os.environ["GOOGLE_API_KEY"] = "MASUKKAN_API_KEY_ANDA"
# genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

def generate_food_candidates(query_text):
    # Prompt yang lebih spesifik agar menghapus angka/satuan
    prompt = f"""
<<<<<<< HEAD
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
=======
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
            
>>>>>>> b338be47eec396be11b2212a43cff6c3fcb14bb2
            response = model.generate_content(prompt)
            text_resp = response.text.strip()
            
            # Parsing JSON
            candidates = json.loads(text_resp)
            if isinstance(candidates, list):
<<<<<<< HEAD
                # Jangan append query_text asli kalau mengandung angka!
                # Kita percaya hasil LLM saja yang sudah bersih.
                return candidates 
            
        except Exception as e:
            print(f"⚠️ Model {model_name} error: {e}")
            continue

    # Fallback darurat: Kembalikan input asli (apa boleh buat)
    print("❌ Semua LLM Gagal. Menggunakan input asli.")
=======
                candidates.append(query_text) # Tambahkan query asli sebagai fallback terakhir
                return candidates
            
        except Exception as e:
            # JANGAN return str(e) di sini, karena akan mematikan loop.
            # Print error saja, lalu biarkan loop lanjut ke model berikutnya.
            print(f"Gagal dengan model {model_name}: {e}")
            continue 

    # Fallback jika SEMUA model gagal
    print("Semua model gagal, menggunakan fallback default.")
>>>>>>> b338be47eec396be11b2212a43cff6c3fcb14bb2
    return [query_text]