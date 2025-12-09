"""
NutriMori AI Core Module
"""

try:
    from .matcher import FoodMatcher
    from .nutrition import NutritionCalculator
    from .llm_helper import generate_food_candidates
    from .portion import portion_to_gram
    
    __all__ = [
        'FoodMatcher',
        'NutritionCalculator',
        'generate_food_candidates',
        'portion_to_gram'
    ]
except ImportError as e:
    print(f"Warning: Failed to import some modules: {e}")
    print("Make sure all dependencies are installed: pip install -r requirements.txt")
