# NutriMori AI Service

Flask API for food recognition and nutrition calculation.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables (optional):

```bash
cp .env.example .env
# Edit .env with your configurations
```

3. Run the application:

```bash
python app.py
```

Or with Gunicorn (production):

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Health Check

```
GET /health
```

### Parse Food Text

```
POST /api/parse-food
Content-Type: application/json

{
  "text": "2 porsi nasi goreng",
  "quantity": 2,
  "unit": "porsi"
}
```

### Match Food Name

```
POST /api/match-food
Content-Type: application/json

{
  "name": "nasi goreng",
  "top_k": 5
}
```

### Calculate Nutrition

```
POST /api/calculate-nutrition
Content-Type: application/json

{
  "food_id": 123,
  "quantity": 2,
  "unit": "porsi"
}
```

### Convert Portion to Grams

```
POST /api/portion-to-gram
Content-Type: application/json

{
  "quantity": 2,
  "unit": "porsi",
  "food_name": "nasi goreng"
}
```

## Environment Variables

- `PORT`: Server port (default: 5000)
- `DEBUG`: Debug mode (default: False)
- `GEMINI_API_KEY`: Google Gemini API key (optional, already set in code)

## Data Requirements

The service expects the following files in `ai/data/`:

- `data pangan bersih.parquet`
- `build_embeddings.npy`
- `build_index.faiss`
