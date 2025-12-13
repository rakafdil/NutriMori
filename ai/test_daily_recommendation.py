from ai.core.daily_recommendation import generate_daily_recommendation

weekly_analysis = {
    "patterns": [
        {
            "type": "negative",
            "message": "Asupan protein kurang dari target",
            "impact": "High"
        }
    ],
    "recommendations": [
        "Tambahkan sumber protein seperti telur, ikan, atau tahu"
    ]
}

user_preferences = {
    "budget": 3000,
    "likes": ["tahu", "tempe"],
    "avoid": ["gorengan"]
}

food_catalog = [
    {
        "foodId": 1,
        "name": "Tahu rebus",
        "estimatedPrice": 1800,
        "nutrition": {"Protein": 10, "Lemak": 2}
    },
    {
        "foodId": 2,
        "name": "Tempe panggang",
        "estimatedPrice": 2100,
        "nutrition": {"Protein": 12, "Lemak": 4}
    },
    {
        "foodId": 3,
        "name": "Ayam goreng",
        "estimatedPrice": 3500,
        "nutrition": {"Protein": 14, "Lemak": 20}
    }
]

result = generate_daily_recommendation(
    weekly_analysis=weekly_analysis,
    user_preferences=user_preferences,
    food_catalog=food_catalog
)

print(result)