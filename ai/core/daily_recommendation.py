# ai/core/daily_recommendation.py

from typing import Dict, List


def generate_daily_recommendation(
    weekly_analysis: Dict,
    user_preferences: Dict,
    food_catalog: List[Dict],
    top_k: int = 5
) -> Dict:
    """
    FINAL DAILY RECOMMENDATION (BACKEND CONTRACT)

    INPUT (dari backend / Supabase):
    - weekly_analysis:
        hasil dari table nutrition_analysis
    - user_preferences:
        { budget, likes, avoid }
    - food_catalog:
        list food_items dari Supabase (harga + nutrisi)

    OUTPUT (ke frontend):
    {
        "recommendedFoods": [
            { foodId, name, estimatedPrice, reason }
        ]
    }

    CATATAN:
    - weekly_analysis TIDAK dikirim ke FE
    - budget hanya constraint
    - PURE RULE-BASED (NO AI, NO DB ACCESS)
    """

    # ===============================
    # 1. USER PREFERENCES
    # ===============================
    budget = user_preferences.get("budget")
    likes = set(x.lower() for x in user_preferences.get("likes", []))
    avoid = set(x.lower() for x in user_preferences.get("avoid", []))

    # ===============================
    # 2. WEEKLY ISSUE (INTERNAL)
    # ===============================
    patterns = weekly_analysis.get("patterns", [])
    recommendations_text = weekly_analysis.get("recommendations", [])

    key_issue = None
    for p in patterns:
        if p.get("type") == "negative" and p.get("impact") == "High":
            key_issue = p.get("message")
            break

    if not key_issue and patterns:
        key_issue = patterns[0].get("message")

    main_recommendation = (
        recommendations_text[0]
        if recommendations_text else None
    )

    # ===============================
    # 3. SCORING FOOD CATALOG
    # ===============================
    scored_foods = []

    for food in food_catalog:
        food_id = food.get("foodId") or food.get("id")
        name = food.get("name", "")
        price = food.get("estimatedPrice", food.get("price", 0))
        nutrition = food.get("nutrition", {})

        if not name:
            continue

        # Preferensi user: avoid
        if name.lower() in avoid:
            continue

        # Budget constraint
        if budget and price > budget:
            continue

        protein = nutrition.get("Protein", 0)
        fat = nutrition.get("Lemak Total", nutrition.get("Lemak", 0))
        sugar = nutrition.get("Gula", 0)

        score = 0.0

        # Fokus issue utama (contoh: protein)
        if key_issue and "protein" in key_issue.lower():
            if protein >= 8:
                score += 2
            else:
                score -= 1

        # Penalti nutrisi buruk
        if fat >= 15:
            score -= 0.5
        if sugar >= 15:
            score -= 0.5

        # Preferensi like
        if likes and any(lk in name.lower() for lk in likes):
            score += 0.5

        # Harga murah = bonus
        if budget:
            score += max(0, 1 - (price / max(budget, 1)))

        scored_foods.append({
            "foodId": food_id,
            "name": name,
            "estimatedPrice": round(price),
            "score": score
        })

    # ===============================
    # 4. SORT & PICK TOP K
    # ===============================
    scored_foods.sort(key=lambda x: x["score"], reverse=True)
    top_foods = scored_foods[:top_k]

    # ===============================
    # 5. FINAL OUTPUT FORMAT
    # ===============================
    recommended_foods = []

    for f in top_foods:
        reason_parts = []

        if key_issue:
            reason_parts.append(key_issue.rstrip("."))

        if main_recommendation:
            reason_parts.append(main_recommendation.rstrip("."))

        reason_parts.append(
            "Dipilih karena harga terjangkau dan sesuai preferensi kamu"
        )

        recommended_foods.append({
            "foodId": f["foodId"],
            "name": f["name"],
            "estimatedPrice": f["estimatedPrice"],
            "reason": ". ".join(reason_parts) + "."
        })

    return {
        "recommendedFoods": recommended_foods
    }