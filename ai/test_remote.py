import requests
import json

# --- PERBAIKAN URL ---
# Ganti /analyze-food menjadi /api/parse-food
url = "https://jakij4ki-nutrimori-api.hf.space/api/parse-food"
# ---------------------

payload = {
    "text": "makan nasi goreng ayam dan es teh",
    "quantity": 1,   # Tambahan opsional sesuai kodinganmu
    "unit": "porsi"  # Tambahan opsional sesuai kodinganmu
}

print(f"🚀 Mengirim pesan ke: {url}...")

try:
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print("Respon Server:")
    print(json.dumps(response.json(), indent=2))

except Exception as e:
    print("Gagal konek:", e)