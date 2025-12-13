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

        # --- LOGIKA LOOPING 2x (Direct Match -> LLM Fallback) ---
        final_matches = []
        used_method = "unknown"
        candidates = []

        # Loop maksimal 2 kali
        # Attempt 1: Direct Database Search (Tanpa LLM)
        # Attempt 2: LLM Refinement (Kalau Attempt 1 gagal)
        for attempt in range(1, 3):
            print(f"\n🔄 Attempt {attempt}/2 processing...")
            
            if attempt == 1:
                # STRATEGI 1: Pakai input mentah user
                print("   👉 Strategy: Direct Database Search")
                candidates = [text] 
                used_method = "direct_match"
            else:
                # STRATEGI 2: Tanya LLM (Gemini)
                print("   👉 Strategy: LLM Refinement (Gemini)")
                # Kalau gagal di attempt 1, kita minta bantuan AI
                candidates = generate_food_candidates(text)
                print(f"   🤖 LLM Candidates: {candidates}")
                used_method = "llm_enhanced"

            # Proses Matching ke Database
            current_matches = get_matcher().match_with_llm_candidates(candidates, top_final=5)
            
            # Cek Similarity Score
            if current_matches:
                top_score = current_matches[0]['similarity']
                print(f"   📊 Best Score: {top_score:.4f}")

                # RULE: Jika score >= 0.5, kita anggap valid dan RETURN
                if top_score >= 0.5:
                    print("   ✅ Match Found! Stopping loop.")
                    final_matches = current_matches
                    break # Keluar dari loop
                else:
                    print("   ⚠️ Score < 0.5. Discarding results.")
                    # Jika ini attempt terakhir, terpaksa kita pakai hasilnya (atau kosongkan)
                    if attempt == 2:
                        print("   ❌ Last attempt failed to get high score. Returning best effort.")
                        final_matches = current_matches
            else:
                print("   ❌ No matches found in DB.")
        
        # ---------------------------------------------------------

        if not final_matches:
            return jsonify({
                'success': False, 
                'message': 'No matching food found after 2 attempts',
                'input': text
            }), 404
        
        # 3. Calculate Nutrition (Dari hasil final_matches)
        nutrition = get_nutrition_calc().get_nutrition_smart(final_matches, qty, unit)
        
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
            'method_used': used_method, # Info apakah pakai direct atau llm
            'candidates': candidates,
            'matches': final_matches[:5], # Kembalikan top 5
            'nutrition': output_nutrisi,
            'metadata': {
                'logic': nutrition.get('metode'),
                'score': final_matches[0]['similarity'] if final_matches else 0,
                'mode': 'supabase' if USE_SUPABASE else 'local'
            }
        })
        
    except Exception as e:
        print(f"❌ Server Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=True)