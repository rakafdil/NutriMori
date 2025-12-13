# ai/core/daily_recommendation.py

from typing import Dict, List


def generate_daily_recommendation(
    weekly_analysis: Dict,
    user_preferences: Dict,
    food_catalog: List[Dict],
    top_k: int = 5
) -> Dict:
    """
    FINAL DAILY RECOMMENDATION (BACKEND CONTRACT VERSION)

    - Input:
        - weekly_analysis: hasil weekly analyzer (dipakai INTERNAL)
        - user_preferences: { budget, likes, avoid }
        - food_catalog: data makanan dari DB (harga + nutrisi)

    - Output:
        {
          "recommendedFoods": [
            { foodId, name, estimatedPrice, reason }
          ]
        }

    NOTE:
    - weekly_analysis TIDAK dikirim ke FE
    - budget hanya sebagai constraint
    """

    # ---------- USER PREF ----------
    budget = user_preferences.get("budget")
    likes = set(x.lower() for x in user_preferences.get("likes", []))
    avoid = set(x.lower() for x in user_preferences.get("avoid", []))

    # ---------- WEEKLY ISSUE (INTERNAL ONLY) ----------
    patterns = weekly_analysis.get("patterns", [])
    recommendations_text = weekly_analysis.get("recommendations", [])

    key_issue = None
    for p in patterns:
        if p.get("type") == "negative" and p.get("impact") == "High":
            key_issue = p.get("message")
            break

    if not key_issue and patterns:
        key_issue = patterns[0].get("message")

    main_recommendation = recommendations_text[0] if recommendations_text else None

    # ---------- RULE-BASED SCORING ----------
    scored_foods = []

    for food in food_catalog:
        food_id = food.get("foodId")
        name = food.get("name", "")
        price = food.get("estimatedPrice", food.get("price", 0))
        nutrition = food.get("nutrition", {})

        if not name:
            continue

        # Preferensi avoid
        if name.lower() in avoid:
            continue

        # Budget constraint
        if budget and price > budget:
            continue

        protein = nutrition.get("Protein", 0)
        fat = nutrition.get("Lemak Total", nutrition.get("Lemak", 0))
        sugar = nutrition.get("Gula", 0)

        score = 0

        # Fokus issue utama
        if key_issue and "protein" in key_issue.lower():
            if protein >= 8:
                score += 2
            else:
                score -= 1

        # Penalti makanan buruk
        if fat >= 15:
            score -= 0.5
        if sugar >= 15:
            score -= 0.5

        # Preferensi user
        if likes and any(lk in name.lower() for lk in likes):
            score += 0.5

        # Harga murah = bonus
        score += max(0, 1 - (price / max(budget or price, 1)))

        scored_foods.append({
            "foodId": food_id,
            "name": name,
            "estimatedPrice": round(price, 0),
            "score": score
        })

    # ---------- SORT & PICK ----------
    scored_foods.sort(key=lambda x: x["score"], reverse=True)
    top_foods = scored_foods[:top_k]

    # ---------- FINAL OUTPUT ----------
    recommended_foods = []
    for f in top_foods:
        reason_parts = []

        if key_issue:
            reason_parts.append(key_issue.rstrip("."))

        if main_recommendation:
            reason_parts.append(main_recommendation.rstrip("."))

        reason_parts.append("Dipilih karena harga terjangkau dan sesuai preferensi kamu.")

        recommended_foods.append({
            "foodId": f["foodId"],
            "name": f["name"],
            "estimatedPrice": f["estimatedPrice"],
            "reason": ". ".join(reason_parts) + "."
        })

    return {
        "recommendedFoods": recommended_foods
    }
