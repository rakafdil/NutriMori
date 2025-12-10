#!/bin/bash

# =============================================================================
# Generate Sample Food Logs for Testing Habit Insights
# =============================================================================
# Usage: ./generate-sample-data.sh <access_token> [days]
# Example: ./generate-sample-data.sh "eyJhbGc..." 7
# =============================================================================

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${1:-}"
DAYS="${2:-7}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Access token required${NC}"
    echo "Usage: $0 <access_token> [days]"
    echo "Example: $0 'eyJhbGc...' 7"
    exit 1
fi

echo -e "${GREEN}=== Generating Sample Food Logs ===${NC}"
echo "Base URL: $BASE_URL"
echo "Days: $DAYS"
echo ""

# Sample meals data
BREAKFAST_MEALS=(
    "2 telur rebus, roti gandum 2 lembar, kopi hitam"
    "oatmeal dengan buah, susu almond"
    "nasi uduk, ayam goreng, tempe"
    "pancake, maple syrup, buah strawberry"
    "bubur ayam, kerupuk, cakwe"
    "roti panggang, selai kacang, pisang"
    "nasi goreng telur, kerupuk"
)

LUNCH_MEALS=(
    "nasi putih 1 piring, ayam bakar, sayur bayam, tempe goreng"
    "mie ayam bakso, pangsit, sayur sawi"
    "nasi padang: rendang, sambal ijo, sayur nangka"
    "gado-gado, lontong, kerupuk"
    "soto ayam, nasi, emping, sate"
    "nasi campur: ikan, tahu, sayur"
    "spaghetti bolognese, salad, garlic bread"
)

DINNER_MEALS=(
    "nasi putih, ikan bakar, sayur asem"
    "nasi goreng seafood, telur mata sapi"
    "sop buntut, nasi, kerupuk"
    "pecel lele, nasi, lalapan"
    "nasi, ayam kecap, tahu tempe, sayur"
    "pizza, salad, french fries"
    "burger, kentang goreng, cola"
)

SNACK_MEALS=(
    "pisang goreng 3 potong, teh manis"
    "kopi, kue kering"
    "salad buah"
    "yogurt, granola"
    "keripik singkong, jus jeruk"
)

# Counter
SUCCESS_COUNT=0
FAIL_COUNT=0

# Generate data for each day
for ((i=0; i<$DAYS; i++)); do
    # Calculate date (going backwards from today)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        BREAKFAST_TIME=$(date -v-${i}d -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 07:00:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT07:00:00Z)
        LUNCH_TIME=$(date -v-${i}d -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 12:30:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT12:30:00Z)
        DINNER_TIME=$(date -v-${i}d -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 19:00:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT19:00:00Z)
        SNACK_TIME=$(date -v-${i}d -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 15:30:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT15:30:00Z)
    else
        # Linux/Windows Git Bash
        BREAKFAST_TIME=$(date -u -d "$i days ago 07:00:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT07:00:00Z)
        LUNCH_TIME=$(date -u -d "$i days ago 12:30:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT12:30:00Z)
        DINNER_TIME=$(date -u -d "$i days ago 19:00:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT19:00:00Z)
        SNACK_TIME=$(date -u -d "$i days ago 15:30:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT15:30:00Z)
    fi
    
    DAY_NUM=$((DAYS - i))
    echo -e "${YELLOW}Day $DAY_NUM:${NC}"
    
    # Random meal selection
    BREAKFAST_INDEX=$((RANDOM % ${#BREAKFAST_MEALS[@]}))
    LUNCH_INDEX=$((RANDOM % ${#LUNCH_MEALS[@]}))
    DINNER_INDEX=$((RANDOM % ${#DINNER_MEALS[@]}))
    SNACK_INDEX=$((RANDOM % ${#SNACK_MEALS[@]}))
    
    # Create Breakfast
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/food-logs" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"raw_text\": \"${BREAKFAST_MEALS[$BREAKFAST_INDEX]}\",
            \"meal_type\": \"breakfast\",
            \"created_at\": \"$BREAKFAST_TIME\"
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        echo "  ✅ Breakfast created"
        ((SUCCESS_COUNT++))
    else
        echo "  ❌ Breakfast failed (HTTP $HTTP_CODE)"
        ((FAIL_COUNT++))
    fi
    
    # Create Lunch
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/food-logs" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"raw_text\": \"${LUNCH_MEALS[$LUNCH_INDEX]}\",
            \"meal_type\": \"lunch\",
            \"created_at\": \"$LUNCH_TIME\"
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        echo "  ✅ Lunch created"
        ((SUCCESS_COUNT++))
    else
        echo "  ❌ Lunch failed (HTTP $HTTP_CODE)"
        ((FAIL_COUNT++))
    fi
    
    # Create Dinner
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/food-logs" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"raw_text\": \"${DINNER_MEALS[$DINNER_INDEX]}\",
            \"meal_type\": \"dinner\",
            \"created_at\": \"$DINNER_TIME\"
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        echo "  ✅ Dinner created"
        ((SUCCESS_COUNT++))
    else
        echo "  ❌ Dinner failed (HTTP $HTTP_CODE)"
        ((FAIL_COUNT++))
    fi
    
    # Random snack (50% chance)
    if [ $((RANDOM % 2)) -eq 0 ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/food-logs" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"raw_text\": \"${SNACK_MEALS[$SNACK_INDEX]}\",
                \"meal_type\": \"snack\",
                \"created_at\": \"$SNACK_TIME\"
            }")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
            echo "  ✅ Snack created"
            ((SUCCESS_COUNT++))
        else
            echo "  ❌ Snack failed (HTTP $HTTP_CODE)"
            ((FAIL_COUNT++))
        fi
    fi
    
    echo ""
    sleep 0.5  # Small delay to avoid overwhelming the server
done

# Summary
echo -e "${GREEN}=== Summary ===${NC}"
echo -e "Total Success: ${GREEN}$SUCCESS_COUNT${NC}"
echo -e "Total Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ Sample data generated successfully!${NC}"
    echo ""
    echo "You can now test habit insights with:"
    echo "  GET $BASE_URL/habit-insights?period=weekly"
    echo "  Authorization: Bearer $TOKEN"
else
    echo -e "${RED}❌ Failed to generate sample data${NC}"
    echo "Please check:"
    echo "  - Access token is valid"
    echo "  - Backend server is running"
    echo "  - Food logs endpoint is accessible"
fi
