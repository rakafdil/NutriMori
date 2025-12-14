# ai/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import re
from pathlib import Path
from dotenv import load_dotenv

# --- LOAD ENV DARI FOLDER ai/ (root ai) ---
current_file = Path(__file__).resolve()
project_root = current_file.parent
env_path = project_root / ".env"
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

# allow import "core.*" from ai/
sys.path.append(str(current_file.parent))

app = Flask(__name__)
CORS(app)

# --- EAGER INITIALIZATION AT STARTUP ---
PRELOAD_MODELS = os.environ.get("PRELOAD_MODELS", "1") == "1"

if PRELOAD_MODELS:
    print("⏳ Pre-loading models... (this may take a moment)")

    from core.matcher import FoodMatcher, get_embedding_model
    from core.nutrition import NutritionCalculator

    # Pre-load embedding model first (shared across instances)
    get_embedding_model()

    matcher = FoodMatcher()
    print("✅ FoodMatcher loaded")

    nutrition_calc = NutritionCalculator()
    print("✅ NutritionCalculator loaded")
else:
    print("⚡ Lazy loading mode (PRELOAD_MODELS=0)")
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


# --- CANDIDATE PARSING UTILITY ---
def parse_candidates(raw_text: str) -> list[str]:
    """
    Split raw input into independent food candidates.
    Handles common separators: "dan", "lalu", ",", "+", "&"
    """
    if not raw_text or not raw_text.strip():
        return []
    separator_pattern = r"\s+dan\s+|\s+lalu\s+|,|\+|&"
    candidates = re.split(separator_pattern, raw_text, flags=re.IGNORECASE)
    return [c.strip() for c in candidates if c and c.strip()]


def match_candidate(candidate: str, top_n: int = 5) -> dict:
    """
    Attempt 1: Direct database search
    Attempt 2: LLM refinement (Gemini) if score < 0.5
    """
    if not candidate or not candidate.strip():
        return {"matches": [], "method": "none"}

    try:
        from core.llm_helper import generate_food_candidates

        food_matcher = get_matcher()
        final_matches = []
        used_method = "unknown"
        search_terms = []

        for attempt in range(1, 3):
            print(f"   🔄 Attempt {attempt}/2 for '{candidate}'")

            if attempt == 1:
                print("      👉 Strategy: Direct Database Search")
                search_terms = [candidate]
                used_method = "direct_match"
            else:
                print("      👉 Strategy: LLM Refinement (Gemini)")
                search_terms = generate_food_candidates(candidate)
                print(f"      🤖 LLM Terms: {search_terms}")
                used_method = "llm_enhanced"

            current_matches = food_matcher.match_with_llm_candidates(
                search_terms, top_final=top_n
            )

            if current_matches:
                top_score = current_matches[0].get("similarity", 0)
                print(f"      📊 Best Score: {top_score:.4f}")

                if top_score >= 0.5:
                    print("      ✅ Match Found! Stopping loop.")
                    final_matches = current_matches
                    break
                else:
                    print("      ⚠️ Score < 0.5. Trying next strategy...")
                    if attempt == 2:
                        print("      ❌ Last attempt. Returning best effort.")
                        final_matches = current_matches
            else:
                print("      ❌ No matches found in DB.")

        results = []
        for match in final_matches:
            results.append(
                {
                    "food_id": match.get("food_id", match.get("id")),
                    "nama": match.get("nama", match.get("name", "")),
                    "similarity": round(float(match.get("similarity", 0)), 4),
                }
            )

        results.sort(key=lambda x: x["similarity"], reverse=True)

        return {
            "matches": results[:top_n],
            "method": used_method,
            "search_terms": search_terms,
        }

    except Exception as e:
        print(f"❌ Error matching candidate '{candidate}': {e}")
        return {"matches": [], "method": "error", "error": str(e)}


print(f"🚀 App ready (mode: {'supabase' if USE_SUPABASE else 'local'})")

# --- ROUTES ---


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify(
        {
            "status": "healthy",
            "service": "NutriMori AI Service",
            "mode": "supabase" if USE_SUPABASE else "local",
        }
    )


@app.route("/api/match-foods", methods=["POST"])
def match_foods():
    """
    Request Body:
        { "text": "tahu telor dan 3 tempe, nasi goreng", "limit": 5 }
    """
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing text field"}), 400

        raw_text = data["text"]
        top_n = data.get("limit", 5)

        print(f"\n📥 Match Foods Request: '{raw_text}'")

        candidates = parse_candidates(raw_text)
        print(f"📋 Parsed Candidates: {candidates}")

        if not candidates:
            return jsonify([]), 200

        results = []
        for candidate in candidates:
            print(f"\n🔍 Processing candidate: '{candidate}'")
            match_data = match_candidate(candidate, top_n=top_n)

            results.append(
                {
                    "candidate": candidate,
                    "match_result": match_data.get("matches", []),
                    "method": match_data.get("method", "unknown"),
                    "search_terms": match_data.get("search_terms", []),
                }
            )

            print(
                f"   ✅ Found {len(match_data.get('matches', []))} matches (method: {match_data.get('method')})"
            )

        return jsonify(results), 200

    except Exception as e:
        print(f"❌ Server Error in match_foods: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/parse-food", methods=["POST"])
def parse_food():
    """
    Legacy single-food parse endpoint.
    Request Body:
        { "text": "...", "quantity": 1, "unit": "porsi" }
    """
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing text"}), 400

        text = data["text"]
        qty = data.get("quantity", 1)
        unit = data.get("unit", "porsi")

        print(f"\n📥 Request: {text} ({qty} {unit})")

        from core.llm_helper import generate_food_candidates

        final_matches = []
        used_method = "unknown"
        candidates = []

        for attempt in range(1, 3):
            print(f"\n🔄 Attempt {attempt}/2 processing...")

            if attempt == 1:
                print("   👉 Strategy: Direct Database Search")
                candidates = [text]
                used_method = "direct_match"
            else:
                print("   👉 Strategy: LLM Refinement (Gemini)")
                candidates = generate_food_candidates(text)
                print(f"   🤖 LLM Candidates: {candidates}")
                used_method = "llm_enhanced"

            current_matches = get_matcher().match_with_llm_candidates(
                candidates, top_final=5
            )

            if current_matches:
                top_score = current_matches[0]["similarity"]
                print(f"   📊 Best Score: {top_score:.4f}")

                if top_score >= 0.5:
                    print("   ✅ Match Found! Stopping loop.")
                    final_matches = current_matches
                    break
                else:
                    print("   ⚠️ Score < 0.5.")
                    if attempt == 2:
                        print("   ❌ Returning best effort.")
                        final_matches = current_matches
            else:
                print("   ❌ No matches found in DB.")

        if not final_matches:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No matching food found after 2 attempts",
                        "input": text,
                    }
                ),
                404,
            )

        nutrition = get_nutrition_calc().get_nutrition_smart(final_matches, qty, unit)

        output_nutrisi = {
            "nama_makanan": nutrition.get("nama_pilihan", "Unknown"),
            "porsi_display": f"{qty} {unit}",
            "berat_gram": round(float(nutrition.get("gram", 0)), 1),
        }

        exclude = ["nama_pilihan", "gram", "metode", "nama", "food_id"]
        for k, v in nutrition.items():
            if k not in exclude:
                try:
                    output_nutrisi[k] = round(float(v), 1)
                except:
                    pass

        return jsonify(
            {
                "success": True,
                "input": {"text": text, "quantity": qty, "unit": unit},
                "method_used": used_method,
                "candidates": candidates,
                "matches": final_matches[:5],
                "nutrition": output_nutrisi,
                "metadata": {
                    "logic": nutrition.get("metode"),
                    "score": final_matches[0]["similarity"] if final_matches else 0,
                    "mode": "supabase" if USE_SUPABASE else "local",
                },
            }
        )

    except Exception as e:
        print(f"❌ Server Error: {e}")
        return jsonify({"error": str(e)}), 500


# ✅ NEW ENDPOINT: DAILY RECOMMENDATION (OUTPUT: recommendedFoods only)
@app.route("/api/daily-recommendation", methods=["POST"])
def daily_recommendation():
    """
    Request Body:
    {
      "userId": "...",
      "weeklyAnalysis": {...},
      "userPreferences": {...},    # budget/avoid/likes
      "candidateCatalog": [ ... ]  # list kandidat dengan pricePerKg & nutrition
    }

    Response:
    { "recommendedFoods": [ ... ] }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        user_id = data.get("userId")
        weekly_analysis = data.get("weeklyAnalysis")
        user_preferences = data.get("userPreferences")
        candidate_catalog = data.get("candidateCatalog")

        if not all([user_id, weekly_analysis, user_preferences, candidate_catalog]):
            return (
                jsonify(
                    {
                        "error": "Missing required fields",
                        "required": [
                            "userId",
                            "weeklyAnalysis",
                            "userPreferences",
                            "candidateCatalog",
                        ],
                    }
                ),
                400,
            )

        from core.daily_recommendation import generate_daily_recommendation

        result = generate_daily_recommendation(
            user_id=user_id,
            weekly_analysis=weekly_analysis,
            user_preferences=user_preferences,
            today_foods=[],  # optional, bisa diisi backend kalau mau
            candidate_catalog=candidate_catalog,
        )

        # kontrak final dari temen backend: ONLY recommendedFoods
        return jsonify({"recommendedFoods": result.get("recommendedFoods", [])}), 200

    except Exception as e:
        print(f"❌ Daily Recommendation Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=True)