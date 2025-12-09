from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# --- FIX 1: LOAD ENV DARI FOLDER ROOT ---
# Kita naik satu level ke atas (..) untuk cari .env
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent # Folder NutriMori
env_path = project_root / '.env'

# Load explicit path
load_dotenv(dotenv_path=env_path)

# Cek apakah Key terbaca (Penting buat debugging)
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("❌ CRITICAL ERROR: API Key tidak ditemukan! Cek lokasi file .env")
else:
    print(f"✅ API Key terdeteksi: {API_KEY[:5]}*******")
    genai.configure(api_key=API_KEY)

# --- SETUP PATH MODULE ---
sys.path.append(str(current_file.parent))

# Import Core
from core.matcher import FoodMatcher
from core.nutrition import NutritionCalculator
from core.llm_helper import generate_food_candidates
from core.portion import portion_to_gram

app = Flask(__name__)
CORS(app)

print("⏳ Initializing AI components...")
try:
    matcher = FoodMatcher()
    nutrition_calc = NutritionCalculator()
    print("✅ AI components ready!")
except Exception as e:
    print(f"❌ Error initializing AI: {e}")

# --- ROUTES ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'NutriMori AI Service'})

@app.route('/api/parse-food', methods=['POST'])
def parse_food():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text'}), 400
        
        text = data['text']
        qty = data.get('quantity', 1)
        unit = data.get('unit', 'porsi')
        
        print(f"\n📥 Request: {text} ({qty} {unit})")

        # 1. LLM Step
        candidates = generate_food_candidates(text)
        print(f"🤖 LLM Candidates: {candidates}")
        
        # 2. Matcher
        match_results = matcher.match_with_llm_candidates(candidates, top_final=5)
        
        if not match_results:
            return jsonify({'success': False, 'message': 'No matching food found'}), 404
        
        # 3. Nutrition
        nutrition = nutrition_calc.get_nutrition_smart(match_results, qty, unit)
        
        # 4. Format Output Rapi
        output_nutrisi = {
            "nama_makanan": nutrition.get('nama_pilihan', 'Unknown'),
            "porsi_display": f"{qty} {unit}",
            "berat_gram": round(nutrition.get('gram', 0), 1)
        }
        
        # Ambil semua angka nutrisi
        exclude = ['nama_pilihan', 'gram', 'metode', 'nama', 'food_id']
        for k, v in nutrition.items():
            if k not in exclude:
                try: output_nutrisi[k] = round(float(v), 1)
                except: pass

        return jsonify({
            'success': True,
            'input': {'text': text, 'quantity': qty, 'unit': unit},
            'candidates': candidates,
            'matches': match_results[:2], # Tampilkan 2 teratas aja biar output ga kepanjangan
            'nutrition': output_nutrisi,
            'metadata': {
                'logic': nutrition.get('metode'),
                'score': match_results[0]['similarity']
            }
        })
        
    except Exception as e:
        print(f"❌ Server Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=True)