from flask import Flask, request, jsonify
from flask_cors import CORS
from core.matcher import FoodMatcher
from core.nutrition import NutritionCalculator
from core.llm_helper import generate_food_candidates
from core.portion import portion_to_gram
import os

app = Flask(__name__)
CORS(app)

# Initialize AI components
print("Initializing AI components...")
matcher = FoodMatcher()
nutrition_calc = NutritionCalculator()
print("AI components ready!")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'NutriMori AI Service'
    })

@app.route('/api/parse-food', methods=['POST'])
def parse_food():
    """
    Parse food text and return matched food items with nutrition data.
    
    Request body:
    {
        "text": "2 porsi nasi goreng",
        "quantity": 2,
        "unit": "porsi"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing required field: text'}), 400
        
        text = data['text']
        quantity = data.get('quantity', 1)
        unit = data.get('unit', 'porsi')
        
        # Step 1: Generate candidates using LLM
        print(f"Parsing: {text}")
        candidates = generate_food_candidates(text)
        print(f"LLM Candidates: {candidates}")
        
        # Step 2: Match candidates with food database
        match_results = matcher.match_with_llm_candidates(candidates, top_final=5)
        
        if not match_results:
            return jsonify({
                'success': False,
                'message': 'No matching food found',
                'matches': []
            }), 404
        
        # Step 3: Calculate nutrition
        nutrition = nutrition_calc.get_nutrition_smart(match_results, quantity, unit)
        
        return jsonify({
            'success': True,
            'input': {
                'text': text,
                'quantity': quantity,
                'unit': unit
            },
            'candidates': candidates,
            'matches': match_results,
            'nutrition': nutrition
        })
        
    except Exception as e:
        print(f"Error in parse_food: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/match-food', methods=['POST'])
def match_food():
    """
    Match food name with database.
    
    Request body:
    {
        "name": "nasi goreng",
        "top_k": 5
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Missing required field: name'}), 400
        
        name = data['name']
        top_k = data.get('top_k', 5)
        
        # Generate candidates and match
        candidates = generate_food_candidates(name)
        matches = matcher.match_with_llm_candidates(candidates, top_final=top_k)
        
        return jsonify({
            'success': True,
            'input': name,
            'candidates': candidates,
            'matches': matches
        })
        
    except Exception as e:
        print(f"Error in match_food: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculate-nutrition', methods=['POST'])
def calculate_nutrition():
    """
    Calculate nutrition for a specific food item.
    
    Request body:
    {
        "food_id": 123,
        "quantity": 2,
        "unit": "porsi"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'food_id' not in data:
            return jsonify({'error': 'Missing required field: food_id'}), 400
        
        food_id = data['food_id']
        quantity = data.get('quantity', 1)
        unit = data.get('unit', 'porsi')
        
        # Get food info
        row = nutrition_calc.df.iloc[food_id]
        
        # Calculate grams
        gram = portion_to_gram(quantity, unit, row.get("nama_clean"))
        
        # Calculate nutrition
        result = {
            'food_id': food_id,
            'nama': row["Nama Bahan Makanan"],
            'quantity': quantity,
            'unit': unit,
            'gram': gram
        }
        
        for col in nutrition_calc.nutr_cols:
            result[col] = float(row.get(col, 0)) * (gram / 100)
        
        return jsonify({
            'success': True,
            'nutrition': result
        })
        
    except Exception as e:
        print(f"Error in calculate_nutrition: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/portion-to-gram', methods=['POST'])
def convert_portion():
    """
    Convert portion to grams.
    
    Request body:
    {
        "quantity": 2,
        "unit": "porsi",
        "food_name": "nasi goreng"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'quantity' not in data or 'unit' not in data:
            return jsonify({'error': 'Missing required fields: quantity, unit'}), 400
        
        quantity = data['quantity']
        unit = data['unit']
        food_name = data.get('food_name')
        
        gram = portion_to_gram(quantity, unit, food_name)
        
        return jsonify({
            'success': True,
            'input': {
                'quantity': quantity,
                'unit': unit,
                'food_name': food_name
            },
            'gram': gram
        })
        
    except Exception as e:
        print(f"Error in convert_portion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))  # Changed default port to 5050
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    try:
        app.run(host='0.0.0.0', port=port, debug=True)
    except OSError as e:
        print(f"Port {port} is unavailable or blocked. Try a different port or check your firewall settings.")
        print(f"Error details: {e}")
