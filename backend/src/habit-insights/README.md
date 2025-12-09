# Habit Insights Module

Module ini menyediakan analisis pola makan pengguna selama 3 minggu menggunakan Machine Learning. Sistem mengintegrasikan NestJS backend dengan Python ML API untuk menghasilkan insight mendalam tentang kebiasaan makan.

## 📋 Fitur Utama

- **Analisis Pola 3 Minggu**: Menganalisis data food logs selama 21 hari
- **Machine Learning Integration**: Menggunakan Python ML API untuk analisis mendalam
- **Nutrient Trends**: Tracking tren nutrisi (kalori, protein, karbohidrat, lemak, serat)
- **Meal Timing Analysis**: Menganalisis konsistensi waktu makan
- **Pattern Detection**: Mengidentifikasi pola kebiasaan makan berbahaya
- **Smart Recommendations**: Memberikan rekomendasi yang actionable dan personal
- **Health Score**: Menghitung skor kesehatan 0-100 berdasarkan multiple factors
- **Fallback System**: Jika ML API tidak tersedia, menggunakan rule-based analysis

## 🏗️ Arsitektur


## 🔌 API Endpoints

### GET `/habit-insights`

Menganalisis pola makan pengguna dan menghasilkan insight.

**Authentication**: Required (JWT Bearer Token)

**Query Parameters**:

| Parameter   | Type   | Required | Default        | Description                      |
|------------|--------|----------|----------------|----------------------------------|
| `userId`   | UUID   | ✅ Yes   | -              | ID pengguna yang akan dianalisis |
| `startDate`| string | ❌ No    | 3 weeks ago    | Tanggal mulai analisis (ISO 8601)|
| `endDate`  | string | ❌ No    | Today          | Tanggal akhir analisis (ISO 8601)|

**Example Request**:

```bash
# Menggunakan periode default (3 minggu terakhir)
GET /habit-insights?userId=123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <your-jwt-token>

# Menggunakan periode custom
GET /habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&startDate=2025-11-01&endDate=2025-12-08
Authorization: Bearer <your-jwt-token>


Example Response:

{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "periodStart": "2025-11-17T00:00:00.000Z",
  "periodEnd": "2025-12-08T23:59:59.999Z",
  "daysAnalyzed": 21,
  "totalMeals": 63,
  "summary": "Analyzed 63 meals over 21 days. Several patterns were identified that could benefit from attention.",
  "recommendations": [
    "Increase protein intake to 112.0g per day",
    "Consider having dinner earlier (before 19:00) for better digestion",
    "Maintain consistent eating patterns throughout the week",
    "Try not to skip meals, especially breakfast",
    "Increase food variety for better nutrient coverage"
  ],
  "patterns": [
    {
      "pattern": "Late evening eating pattern",
      "frequency": "Daily",
      "impact": "Medium",
      "description": "Most meals are logged around 20:00. Late eating may affect sleep quality."
    },
    {
      "pattern": "Low protein intake",
      "frequency": "Daily",
      "impact": "High",
      "description": "Average 45.2g protein/day, below recommended 112.0g"
    },
    {
      "pattern": "Weekend overeating",
      "frequency": "Weekly",
      "impact": "Medium",
      "description": "Significantly more meals logged during weekends"
    }
  ],
  "nutrientTrends": [
    {
      "nutrient": "Calories",
      "averageDaily": 1850.5,
      "trend": "stable",
      "recommended": 2100,
      "status": "Below target"
    },
    {
      "nutrient": "Protein",
      "averageDaily": 45.2,
      "trend": "decreasing",
      "recommended": 112,
      "status": "Below target"
    },
    {
      "nutrient": "Carbohydrates",
      "averageDaily": 220.8,
      "trend": "increasing",
      "recommended": 262.5,
      "status": "Below target"
    },
    {
      "nutrient": "Fat",
      "averageDaily": 68.3,
      "trend": "stable",
      "recommended": 70,
      "status": "On target"
    },
    {
      "nutrient": "Fiber",
      "averageDaily": 22.1,
      "trend": "stable",
      "recommended": 30,
      "status": "Below target"
    }
  ],
  "mealTimings": [
    {
      "mealType": "Breakfast",
      "averageTime": "07:25",
      "consistency": 85,
      "note": "Very consistent meal timing"
    },
    {
      "mealType": "Lunch",
      "averageTime": "12:45",
      "consistency": 72,
      "note": "Moderately consistent"
    },
    {
      "mealType": "Dinner",
      "averageTime": "20:15",
      "consistency": 65,
      "note": "Moderately consistent"
    },
    {
      "mealType": "Snack",
      "averageTime": "15:30",
      "consistency": 45,
      "note": "Inconsistent meal timing - consider establishing a routine"
    }
  ],
  "healthScore": 68,
  "generatedAt": "2025-12-09T10:30:00.000Z"
}


Response Fields:

Field	Type	Description
userId	string	ID pengguna
periodStart	string	Tanggal mulai periode analisis
periodEnd	string	Tanggal akhir periode analisis
daysAnalyzed	number	Jumlah hari yang dianalisis
totalMeals	number	Total meal logs dalam periode
summary	string	Ringkasan hasil analisis dari ML
recommendations	string[]	List rekomendasi actionable (max 5)
patterns	array	Pola kebiasaan makan yang teridentifikasi
nutrientTrends	array	Tren nutrisi dengan status dan rekomendasi
mealTimings	array	Analisis konsistensi waktu makan
healthScore	number	Skor kesehatan 0-100
generatedAt	string	Timestamp pembuatan insight
Error Responses:

🔧 Setup & Configuration
1. Environment Variables
Tambahkan ke file .env:

2. Install Python Dependencies
3. Start Python ML API Server
Server akan berjalan di http://localhost:5000

4. Verify ML API Health
5. Start NestJS Backend
🧪 Testing
Manual Testing dengan cURL
Testing dengan Postman
Create Request:

Method: GET
URL: http://localhost:3000/habit-insights
Params:
userId: 123e4567-e89b-12d3-a456-426614174000
startDate: 2025-11-17 (optional)
endDate: 2025-12-08 (optional)
Add Authorization:

Type: Bearer Token
Token: <your-jwt-token>
Send Request

Unit Testing
🔍 Cara Kerja Analisis
1. Data Collection
Mengambil food logs dari Supabase untuk periode 3 minggu
Include relasi: food_items, nutrition_rules
Filter by user_id dan date range
2. Local Analysis (NestJS)
Nutrient Trends: Menghitung rata-rata, trend (increasing/decreasing/stable), dan status vs rekomendasi
Meal Timings: Menganalisis konsistensi waktu makan per kategori (breakfast/lunch/dinner/snack)
Daily Stats: Aggregasi meal count dan total calories per hari
3. ML Analysis (Python API)
Pattern Detection:

Late evening eating
Low meal frequency
Weekend overeating
Insufficient/excessive caloric intake
Low protein intake
Inconsistent carbohydrate intake
Limited food variety
Frequent meal skipping
Recommendation Generation:

Berdasarkan patterns yang terdeteksi
Personalized sesuai user profile (age, weight, height, goals)
Prioritas berdasarkan impact level
4. Health Score Calculation
5. Fallback Mechanism
Jika ML API tidak available:

Menggunakan rule-based analysis
Tetap memberikan basic insights
Menampilkan error log untuk debugging
📊 Data Models
HabitPatternDto
NutrientTrendDto
MealTimingPatternDto
🎯 Use Cases
1. Personal Health Dashboard
2. Nutrition Coaching
3. Progress Tracking
🐛 Troubleshooting
ML API Connection Failed
Problem: ML API call failed: fetch failed

Solution:

Check if Python ML API is running: curl http://localhost:5000/health
Verify ML_API_URL in .env
Check firewall settings
Review Python API logs
No Food Logs Found
Problem: No food logs found for user

Solution:

Verify user has food logs in database
Check date range (default: 3 weeks)
Try with custom startDate and endDate
Verify user_id is correct
Low Health Score
Issue: User consistently gets low health score

Analysis:

Check patterns array for high-impact issues
Review nutrientTrends for deficiencies
Examine mealTimings consistency
Provide targeted recommendations from the response
📈 Performance Optimization
Caching Strategy
Batch Processing
🔐 Security Considerations
Authentication: Endpoint protected by JWT Guard
Authorization: Users can only access their own insights
Rate Limiting: Implement rate limiting to prevent abuse
Data Privacy: Sensitive health data - follow GDPR/HIPAA guidelines
📝 Future Enhancements
 Real-time insights dengan WebSocket
 Export insights to PDF
 Compare insights dengan users lain (anonymized)
 Integration dengan wearables (Fitbit, Apple Health)
 Gamification: badges based on health score improvement
 Weekly email reports
 Mobile push notifications untuk reminders