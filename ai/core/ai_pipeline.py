# ai/core/ai_pipeline.py

import uuid
from datetime import datetime, timezone

from .food_parser import parse_food_text
from .llm_helper import generate_food_candidates
from .matcher import FoodMatcher
from .nutrition import NutritionCalculator

matcher = FoodMatcher()
nutrition_calc = NutritionCalculator()


def infer_meal_type(ts: datetime):
    h = ts.hour
    if 4 <= h < 11: return "Sarapan"
    if 11 <= h < 16: return "Makan Siang"
    if 16 <= h < 22: return "Makan Malam"
    return "Camilan"


def smart_food_pipeline(text: str, ts: datetime | None = None):
    if ts is None:
        ts = datetime.now(timezone.utc)

    meal_type = infer_meal_type(ts)

    # 1. SMART FOOD PARSER
    parsed = parse_food_text(text)

    smart_items = []
    total_nutr = {}

    for idx, item in enumerate(parsed, start=1):
        name = item["name"]
        qty = item["qty"]
        unit = item["unit"]
        conf = item["confidence"]

        # 2. LLM NORMALIZER
        candidates = generate_food_candidates(name)

        # 3. MATCHER
        matches = matcher.match_with_llm_candidates(candidates, top_final=5)

        if not matches:
            smart_items.append({
                "tempId": idx,
                "detectedName": name,
                "foodId": None,
                "servingSize": {
                    "qty": qty,
                    "unit": unit,
                    "gramWeight": None,
                },
                "confidenceScore": conf,
                "matches": [],
            })
            continue

        # 4. NUTRISI
        nutr = nutrition_calc.get_nutrition_smart(matches, qty, unit)

        for k, v in nutr.items():
            if k in ["nama_pilihan", "gram", "metode"]:
                continue
            if isinstance(v, (int, float)):
                total_nutr[k] = total_nutr.get(k, 0.0) + float(v)

        smart_items.append({
            "tempId": idx,
            "detectedName": name,
            "foodId": matches[0]["food_id"],
            "servingSize": {
                "qty": qty,
                "unit": unit,
                "gramWeight": round(nutr.get("gram", 0), 1)
            },
            "confidenceScore": min(conf, matches[0]["similarity"]),
            "matches": matches[:3],
            "method": nutr.get("metode", "unknown")
        })

    # 5. SMART FOOD LOG OUTPUT
    log_id = f"log_{uuid.uuid4().hex[:8]}"
    created_at = ts.isoformat()

    food_log = {
        "logId": log_id,
        "userInput": text,
        "parsedResult": {
            "mealType": meal_type,
            "items": smart_items
        },
        "createdAt": created_at
    }

    # 6. NUTRITION ANALYZER OUTPUT
    calories = total_nutr.get("Energi", 0.0)
    protein = total_nutr.get("Protein", 0.0)
    carbs = total_nutr.get("Karbohidrat", 0.0)
    fat = total_nutr.get("Lemak Total", total_nutr.get("Lemak", 0.0))
    sugar = total_nutr.get("Gula", 0.0)

    analysis = {
        "analysisId": f"ana_{uuid.uuid4().hex[:8]}",
        "foodLogId": log_id,
        "nutritionFacts": {
            "calories": round(calories, 1),
            "protein": round(protein, 1),
            "carbs": round(carbs, 1),
            "fat": round(fat, 1),
            "sugar": round(sugar, 1),
        },
        "micronutrients": {
            "vitamin_c": round(total_nutr.get("Vitamin C", 0), 1),
            "iron": round(total_nutr.get("Besi", 0), 1),
        },
        "healthTags": [
            tag for tag in [
                "High Protein" if protein >= 20 else None,
                "Low Sugar" if sugar <= 5 else None,
                "High Calorie" if calories >= 700 else None
            ] if tag
        ]
    }

    return {
        "foodLog": food_log,
        "analysis": analysis
    }