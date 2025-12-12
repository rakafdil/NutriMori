import requests
import json

url = "http://localhost:5000/api/parse-food"

payload = {
    "text": "tahu telur dan 3 tempe",
    "quantity": 1,
    "unit": "porsi"
}

headers = {
    "Content-Type": "application/json"
}

try:
    print(f"📡 Mengirim request ke {url}...")
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Pastikan server 'app.py' sudah jalan di terminal lain!")