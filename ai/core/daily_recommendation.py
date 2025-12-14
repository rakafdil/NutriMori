from typing import Dict, List


def generate_daily_recommendation(
    *,
    weekly_analysis: Dict,
    user_preferences: Dict,
    foods_from_supabase: List[Dict],
    top_k: int = 5
) -> Dict:
    """
    DAILY RECOMMENDATION (SUPABASE-AWARE VERSION)

    INPUT:
    - weekly_analysis  : dari table nutrition_analysis / habit_insights_cache
    - user_preferences : dari table user_preferences
        {
          "budget": 30000,
          "avoid": ["gorengan"],
          "likes": ["tahu", "tempe"]
        }
    - foods_from_supabase : hasil JOIN backend dari Supabase, contoh:
        SELECT
          fi.id,
          fi.name,
          fp.price_estimated,
          na.protein,
          na.fat,
          na.sugar
        FROM food_items fi
        JOIN food_prices fp ON ...
        JOIN nutrition_analysis na ON ...

    OUTPUT (FINAL CONTRACT):
    {
      "recommendedFoods": [
        { foodId, name, estimatedPrice, reason }
      ]
    }
    """

    # ===============================
    # 1. USER PREFERENCES
    # ===============================
    budget = user_preferences.get("budget")
    avoid = set(x.lower() for x in user_preferences.get("avoid", []))
    likes = set(x.lower() for x in user_preferences.get("likes", []))

    # ===============================
    # 2. WEEKLY ISSUE (INTERNAL ONLY)
    # ===============================
    patterns = weekly_analysis.get("patterns", [])
    recommendations = weekly_analysis.get("recommendations", [])

    key_issue = None
    for p in patterns:
        if p.get("type") == "negative" and p.get("impact") == "High":
            key_issue = p.get("message")
            break

    if not key_issue and patterns:
        key_issue = patterns[0].get("message")

    main_reco_text = recommendations[0] if recommendations else None

    # ===============================
    # 3. SCORING FOOD (RULE-BASED)
    # ===============================
    scored = []

    for food in foods_from_supabase:
        food_id = food.get("food_id")
        name = food.get("name", "")
        price = food.get("price_estimated", 0)

        protein = food.get("protein", 0)
        fat = food.get("fat", 0)
        sugar = food.get("sugar", 0)

        if not name:
            continue

        # Avoid preference
        if name.lower() in avoid:
            continue

        # Budget constraint
        if budget and price > budget:
            continue

        score = 0

        # Focus weekly issue
        if key_issue and "protein" in key_issue.lower():
            if protein >= 8:
                score += 2
            else:
                score -= 1

        # Penalize unhealthy
        if fat >= 15:
            score -= 0.5
        if sugar >= 15:
            score -= 0.5

        # User likes
        if likes and any(l in name.lower() for l in likes):
            score += 0.5

        # Cheap food bonus
        if budget:
            score += max(0, 1 - (price / budget))

        scored.append({
            "foodId": food_id,
            "name": name,
            "estimatedPrice": round(price),
            "score": score
        })

    # ===============================
    # 4. SORT & PICK TOP
    # ===============================
    scored.sort(key=lambda x: x["score"], reverse=True)
    top_foods = scored[:top_k]

    # ===============================
    # 5. FINAL OUTPUT
    # ===============================
    recommended = []

    for f in top_foods:
        reason_parts = []

        if key_issue:
            reason_parts.append(key_issue.rstrip("."))

        if main_reco_text:
            reason_parts.append(main_reco_text.rstrip("."))

        reason_parts.append(
            "Dipilih karena harga terjangkau dan sesuai preferensi kamu"
        )

        recommended.append({
            "foodId": f["foodId"],
            "name": f["name"],
            "estimatedPrice": f["estimatedPrice"],
            "reason": ". ".join(reason_parts) + "."
        })

    return {
        "recommendedFoods": recommended
    }