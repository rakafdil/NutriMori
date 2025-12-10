from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# --- FIX 1: LOAD ENV DARI FOLDER ROOT ---
current_file = Path(__file__).resolve()
project_root = current_file.parent
env_path = project_root / '.env'
load_dotenv(dotenv_path=env_path)

# --- FORCE SUPABASE MODE ON VERCEL ---
IS_VERCEL = os.environ.get("VERCEL", "0") == "1"
USE_SUPABASE = IS_VERCEL or os.environ.get("USE_SUPABASE", "0") == "1"

# Only import genai if needed (lazy load)
API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    import google.generativeai as genai
    print(f"✅ API Key terdeteksi: {API_KEY[:5]}*******")
    genai.configure(api_key=API_KEY)
else:
    print("❌ CRITICAL ERROR: API Key tidak ditemukan!")

sys.path.append(str(current_file.parent))

app = Flask(__name__)
CORS(app)

# --- LAZY INITIALIZATION ---
matcher = None
nutrition_calc = None

def get_matcher():
    global matcher
    if matcher is None:
        from core.matcher import FoodMatcher
        matcher = FoodMatcher()
    return matcher

def get_nutrition_calc():
    global nutrition_calc
    if nutrition_calc is None:
        from core.nutrition import NutritionCalculator
        nutrition_calc = NutritionCalculator()
    return nutrition_calc

print(f"🚀 App ready (mode: {'supabase' if USE_SUPABASE else 'local'})")

# --- ROUTES ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'service': 'NutriMori AI Service',
        'mode': 'supabase' if USE_SUPABASE else 'local'
    })

@app.route('/debug/memory', methods=['GET'])
def debug_memory():
    try:
        from core.memory_utils import get_process_memory_mb
        mem_mb = get_process_memory_mb()
        return jsonify({
            'memory_mb': round(mem_mb, 2),
            'note': 'Resident Set Size (RSS) of this Python process'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

        # Lazy imports
        from core.llm_helper import generate_food_candidates

        # 1. LLM Step
        candidates = generate_food_candidates(text)
        print(f"🤖 LLM Candidates: {candidates}")
        
        # 2. Matching
        match_results = get_matcher().match_with_llm_candidates(candidates, top_final=5)
        
        if not match_results:
            return jsonify({'success': False, 'message': 'No matching food found'}), 404
        
        # 3. Nutrition
        nutrition = get_nutrition_calc().get_nutrition_smart(match_results, qty, unit)
        
        # 4. Format Output
        output_nutrisi = {
            "nama_makanan": nutrition.get('nama_pilihan', 'Unknown'),
            "porsi_display": f"{qty} {unit}",
            "berat_gram": round(nutrition.get('gram', 0), 1)
        }
        
        exclude = ['nama_pilihan', 'gram', 'metode', 'nama', 'food_id']
        for k, v in nutrition.items():
            if k not in exclude:
                try: output_nutrisi[k] = round(float(v), 1)
                except: pass

        return jsonify({
            'success': True,
            'input': {'text': text, 'quantity': qty, 'unit': unit},
            'candidates': candidates,
            'matches': match_results[:2],
            'nutrition': output_nutrisi,
            'metadata': {
                'logic': nutrition.get('metode'),
                'score': match_results[0]['similarity'] if match_results else 0,
                'mode': 'supabase' if USE_SUPABASE else 'local'
            }
        })
        
    except Exception as e:
        print(f"❌ Server Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=True)