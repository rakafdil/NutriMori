# Nutrition Analysis Module

Module untuk melakukan prediksi dan analisis kalori & nutrisi berdasarkan food log yang telah diinput user.

## Flow Sistem

```
User klik "OK" → Sistem cari info nutrisi di database → Analisa nutrisi (data user & nutrisi) → Simpan hasil analisa ke DB → Return hasil analisis
```

## Database Schema

### Tabel `nutrition_analysis`
Menyimpan hasil analisis dengan struktur:
- **Macronutrients**: calories, protein, carbs, fat, sugar, fiber, sodium, cholesterol
- **Micronutrients**: JSONB field untuk vitamin & mineral
- **Health Tags**: Array tags seperti "High Protein", "Low Sugar"
- **Warnings**: Array peringatan seperti "Exceeds daily sodium limit"
- **User Context**: Snapshot target nutrisi user saat analisis

### Integrasi dengan Database Existing

Module ini bekerja dengan struktur database yang ada:

1. **`food_log_items.food_id`** bertipe `character varying` (string/varchar)
   - Bisa berisi UUID (dari `food_items`)
   - Bisa berisi integer string (dari `food_embeddings`)

2. **Sumber Data Nutrisi**:
   - **Primary**: `food_nutrients` table (untuk UUID food_ids dari `food_items`)
   - **Fallback**: `food_embeddings.nutrition_data` (JSONB - untuk integer food_ids)

3. **Mapping Nutrition Data**:
   ```
   food_embeddings.nutrition_data supports:
   - calories / energi
   - protein
   - carbs / karbohidrat
   - fat / lemak
   - sugar / gula
   - fiber / serat
   - sodium / natrium
   - cholesterol / kolesterol
   ```

## API Endpoints

### 1. Create Nutrition Analysis
```http
POST /nutrition-analysis
Authorization: Bearer {token}
Content-Type: application/json

{
  "foodLogId": "uuid-string"
}
```

**Response:**
```json
{
  "analysisId": "uuid",
  "foodLogId": "uuid",
  "userId": "uuid",
  "nutritionFacts": {
    "calories": 450,
    "protein": 30,
    "carbs": 50,
    "fat": 15,
    "sugar": 5,
    "fiber": 8,
    "sodium": 500,
    "cholesterol": 50
  },
  "micronutrients": {
    "vitamin_c": "10%",
    "iron": "5%",
    "calcium": "15%"
  },
  "healthTags": ["High Protein", "Low Sugar", "Balanced Meal"],
  "analysisNotes": "Total meal contains 450 calories with 30g protein...",
  "meetsGoals": true,
  "warnings": [],
  "createdAt": "2025-12-10T10:00:00Z"
}
```

### 2. Get Analysis by Food Log ID
```http
GET /nutrition-analysis/food-log/{foodLogId}
Authorization: Bearer {token}
```

### 3. Get User History
```http
GET /nutrition-analysis/history?limit=10
Authorization: Bearer {token}
```

## Logic Analisis

### 1. **Data Collection**
- Ambil food log + items dari database
- Ambil data nutrisi untuk setiap food item
- Ambil user preferences & data (goals, allergies, medical history)

### 2. **Calculation**
- Total macronutrients berdasarkan gram_weight
- Asumsi: data nutrisi per 100g, di-scale sesuai porsi aktual
- Estimasi micronutrients (simplified)

### 3. **Health Analysis**
Sistem menghasilkan **health tags** berdasarkan:
- **High Protein**: protein > 25g
- **Low Sugar**: sugar < 10g
- **High Fiber**: fiber > 5g
- **Balanced Meal**: ratio makro seimbang (30% protein, 40% carbs, 30% fat)
- **Heart Healthy**: sodium < 1000mg
- **Muscle Building**: protein > 30g (jika user goal = muscle_gain)

### 4. **Warnings**
Sistem memberikan **warnings** jika:
- Protein terlalu rendah (< 10g)
- Sugar terlalu tinggi (> 30g)
- Sodium melebihi limit (> 2000mg)
- Cholesterol tinggi (> 300mg)
- Kalori terlalu tinggi untuk goal weight_loss (> 600 cal)

### 5. **Meets Goals**
Boolean indicator apakah meal sesuai dengan user goals:
- Jika ada warnings yang critical → `meetsGoals = false`
- Jika semua dalam range normal → `meetsGoals = true`

## Integration dengan Food Logs

Module ini bekerja sama dengan `food-logs` module:
1. User input makanan via food logs
2. Food log di-parse oleh LLM
3. Setelah user confirm, call endpoint nutrition analysis
4. Sistem analisa dan save hasil

## Contoh Usage

```typescript
// Di frontend atau service lain
const analysis = await fetch('/nutrition-analysis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    foodLogId: 'uuid-food-log'
  })
});

const result = await analysis.json();
console.log(result.healthTags); // ["High Protein", "Low Sugar"]
console.log(result.warnings); // []
console.log(result.meetsGoals); // true
```

## Future Enhancements

1. **Advanced Micronutrients**: Integrate dengan food database yang lebih lengkap
2. **Meal Recommendations**: Suggest alternative foods jika ada warnings
3. **Daily Tracking**: Aggregate daily total nutrition
4. **AI Insights**: Gunakan LLM untuk personalized nutrition advice
5. **Goal Progress**: Track progress terhadap user goals over time
