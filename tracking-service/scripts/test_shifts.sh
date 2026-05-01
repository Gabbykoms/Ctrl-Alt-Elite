#!/usr/bin/env bash
# Driver shift report end-to-end test script — run with: bash scripts/test_shifts.sh
set -e

# Validate required env vars
: "${SUPABASE_URL:?Error: SUPABASE_URL env var is not set. Check your .env file.}"
: "${SUPABASE_ANON_KEY:?Error: SUPABASE_ANON_KEY env var is not set. Check your .env file.}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Error: SUPABASE_SERVICE_ROLE_KEY env var is not set. Check your .env file.}"

BASE="http://localhost:8081"
DRIVER_ID="d22fcfa1-ffdd-4422-af5b-3408467136a4"
DRIVER_NAME="Shamsher Ghising Tamang"

PASS=0
FAIL=0
CREATED_SHIFT_IDS=()

ok()   { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

cleanup() {
  if [ ${#CREATED_SHIFT_IDS[@]} -gt 0 ]; then
    echo ""
    echo "=== CLEANUP — deleting created shift reports ==="
    for id in "${CREATED_SHIFT_IDS[@]}"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
        "$SUPABASE_URL/rest/v1/driver_shift_reports?id=eq.$id" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
      echo "  DELETE shift $id → HTTP $STATUS"
    done
  fi
}
trap cleanup EXIT

# ── 1. CLOCK-IN (valid) ───────────────────────────────────────────────────────
echo ""
echo "=== 1. POST /v1/shifts/clock-in — valid clock-in ==="
CLOCK_IN=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/shifts/clock-in" \
  -H "Content-Type: application/json" \
  -d "{
    \"driver_id\": \"$DRIVER_ID\",
    \"driver_name\": \"$DRIVER_NAME\",
    \"radio_number\": \"R-01\",
    \"vehicle_license\": \"CT-BANTAM-1\",
    \"starting_mileage\": 12000,
    \"condition_notes\": \"Vehicle in good condition\"
  }")
CLOCK_IN_STATUS=$(echo "$CLOCK_IN" | tail -1)
CLOCK_IN_BODY=$(echo "$CLOCK_IN" | head -1)
echo "$CLOCK_IN_BODY" | python3 -m json.tool

SHIFT_ID=$(echo "$CLOCK_IN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
SHIFT_STATUS=$(echo "$CLOCK_IN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
ENDING_MILEAGE=$(echo "$CLOCK_IN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ending_mileage',''))" 2>/dev/null)
CLOCK_OUT_TIME=$(echo "$CLOCK_IN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('clock_out_time',''))" 2>/dev/null)

[ "$CLOCK_IN_STATUS" = "201" ]   && ok "201 Created"                           || fail "expected 201, got $CLOCK_IN_STATUS"
[ -n "$SHIFT_ID" ]               && ok "shift id returned ($SHIFT_ID)"          || fail "shift id missing"
[ "$SHIFT_STATUS" = "IN_PROGRESS" ] && ok "status is IN_PROGRESS"              || fail "status not IN_PROGRESS (got: $SHIFT_STATUS)"
[ "$ENDING_MILEAGE" = "None" ] || [ -z "$ENDING_MILEAGE" ] \
                                 && ok "ending_mileage is null"                  || fail "ending_mileage should be null (got: $ENDING_MILEAGE)"
[ "$CLOCK_OUT_TIME" = "None" ] || [ -z "$CLOCK_OUT_TIME" ] \
                                 && ok "clock_out_time is null"                  || fail "clock_out_time should be null (got: $CLOCK_OUT_TIME)"

[ -n "$SHIFT_ID" ] && CREATED_SHIFT_IDS+=("$SHIFT_ID")

# ── 2. CLOCK-IN AGAIN (conflict) ──────────────────────────────────────────────
echo ""
echo "=== 2. POST /v1/shifts/clock-in — conflict (open shift exists), expect 409 ==="
CONFLICT=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/shifts/clock-in" \
  -H "Content-Type: application/json" \
  -d "{\"driver_id\": \"$DRIVER_ID\", \"driver_name\": \"$DRIVER_NAME\", \"starting_mileage\": 13000}")
CONFLICT_STATUS=$(echo "$CONFLICT" | tail -1)
CONFLICT_BODY=$(echo "$CONFLICT" | head -1)
echo "  HTTP status: $CONFLICT_STATUS"
echo "  Body: $CONFLICT_BODY"
[ "$CONFLICT_STATUS" = "409" ] && ok "409 Conflict for duplicate clock-in"      || fail "expected 409, got $CONFLICT_STATUS"

# ── 3. VALIDATION — missing driver_name ───────────────────────────────────────
echo ""
echo "=== 3. POST /v1/shifts/clock-in — missing driver_name, expect 400 ==="
VAL1=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/shifts/clock-in" \
  -H "Content-Type: application/json" \
  -d "{\"driver_id\": \"$DRIVER_ID\", \"starting_mileage\": 12000}")
VAL1_STATUS=$(echo "$VAL1" | tail -1)
VAL1_BODY=$(echo "$VAL1" | head -1)
VAL1_ERROR=$(echo "$VAL1_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
echo "  HTTP status: $VAL1_STATUS"
echo "  Body: $VAL1_BODY"
[ "$VAL1_STATUS" = "400" ]                     && ok "400 for missing driver_name"                 || fail "expected 400, got $VAL1_STATUS"
[ "$VAL1_ERROR" = "driver_name is required" ]  && ok "correct error message"                       || fail "wrong error (got: $VAL1_ERROR)"

# ── 4. VALIDATION — missing starting_mileage ──────────────────────────────────
echo ""
echo "=== 4. POST /v1/shifts/clock-in — missing starting_mileage, expect 400 ==="
VAL2=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/shifts/clock-in" \
  -H "Content-Type: application/json" \
  -d "{\"driver_id\": \"$DRIVER_ID\", \"driver_name\": \"$DRIVER_NAME\"}")
VAL2_STATUS=$(echo "$VAL2" | tail -1)
VAL2_BODY=$(echo "$VAL2" | head -1)
echo "  HTTP status: $VAL2_STATUS"
echo "  Body: $VAL2_BODY"
[ "$VAL2_STATUS" = "400" ] && ok "400 for missing starting_mileage"             || fail "expected 400, got $VAL2_STATUS"

# ── 5. CLOCK-OUT — ending mileage < starting ──────────────────────────────────
echo ""
echo "=== 5. POST /v1/shifts/clock-out — ending < starting, expect 400 ==="
BAD_OUT=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/shifts/clock-out" \
  -H "Content-Type: application/json" \
  -d "{\"driver_id\": \"$DRIVER_ID\", \"ending_mileage\": 5000}")
BAD_OUT_STATUS=$(echo "$BAD_OUT" | tail -1)
BAD_OUT_BODY=$(echo "$BAD_OUT" | head -1)
BAD_OUT_ERROR=$(echo "$BAD_OUT_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
echo "  HTTP status: $BAD_OUT_STATUS"
echo "  Body: $BAD_OUT_BODY"
[ "$BAD_OUT_STATUS" = "400" ]                                && ok "400 for bad ending mileage"          || fail "expected 400, got $BAD_OUT_STATUS"
echo "$BAD_OUT_ERROR" | grep -q "ending_mileage must be >=" && ok "correct error message"                || fail "wrong error (got: $BAD_OUT_ERROR)"

# ── 6. CLOCK-OUT (valid) ──────────────────────────────────────────────────────
echo ""
echo "=== 6. POST /v1/shifts/clock-out — valid clock-out ==="
CLOCK_OUT=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/shifts/clock-out" \
  -H "Content-Type: application/json" \
  -d "{\"driver_id\": \"$DRIVER_ID\", \"ending_mileage\": 12450, \"condition_notes\": \"Minor wear on front left tyre\"}")
CLOCK_OUT_STATUS=$(echo "$CLOCK_OUT" | tail -1)
CLOCK_OUT_BODY=$(echo "$CLOCK_OUT" | head -1)
echo "$CLOCK_OUT_BODY" | python3 -m json.tool

OUT_STATUS=$(echo "$CLOCK_OUT_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
OUT_ENDING=$(echo "$CLOCK_OUT_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ending_mileage',''))" 2>/dev/null)
OUT_CLOCK_OUT_TIME=$(echo "$CLOCK_OUT_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('clock_out_time',''))" 2>/dev/null)
OUT_NOTES=$(echo "$CLOCK_OUT_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('condition_notes',''))" 2>/dev/null)

[ "$CLOCK_OUT_STATUS" = "200" ]           && ok "200 OK"                                              || fail "expected 200, got $CLOCK_OUT_STATUS"
[ "$OUT_STATUS" = "COMPLETED" ]           && ok "status is COMPLETED"                                 || fail "status not COMPLETED (got: $OUT_STATUS)"
[ "$OUT_ENDING" = "12450" ]               && ok "ending_mileage correct (12450)"                      || fail "ending_mileage wrong (got: $OUT_ENDING)"
[ -n "$OUT_CLOCK_OUT_TIME" ] && [ "$OUT_CLOCK_OUT_TIME" != "None" ] \
                               && ok "clock_out_time populated"                                        || fail "clock_out_time missing"
[ "$OUT_NOTES" = "Minor wear on front left tyre" ] \
                               && ok "condition_notes updated"                                         || fail "condition_notes wrong (got: $OUT_NOTES)"

# ── 7. CLOCK-OUT AGAIN (no open shift) ───────────────────────────────────────
echo ""
echo "=== 7. POST /v1/shifts/clock-out — no open shift, expect 400 ==="
NO_SHIFT=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/shifts/clock-out" \
  -H "Content-Type: application/json" \
  -d "{\"driver_id\": \"$DRIVER_ID\", \"ending_mileage\": 12500}")
NO_SHIFT_STATUS=$(echo "$NO_SHIFT" | tail -1)
NO_SHIFT_BODY=$(echo "$NO_SHIFT" | head -1)
echo "  HTTP status: $NO_SHIFT_STATUS"
echo "  Body: $NO_SHIFT_BODY"
[ "$NO_SHIFT_STATUS" = "400" ] && ok "400 for no open shift"                    || fail "expected 400, got $NO_SHIFT_STATUS"

# ── 8. GET SHIFTS FOR DRIVER ──────────────────────────────────────────────────
echo ""
echo "=== 8. GET /v1/shifts/driver/{driverId} — shift history ==="
GET_SHIFTS=$(curl -s "$BASE/v1/shifts/driver/$DRIVER_ID")
echo "$GET_SHIFTS" | python3 -m json.tool

TOTAL=$(echo "$GET_SHIFTS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null)
FOUND=$(echo "$GET_SHIFTS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
shifts=d.get('shifts',[])
print(any(s.get('id')=='${SHIFT_ID}' for s in shifts))
" 2>/dev/null)
DRIVER_ID_IN_RESP=$(echo "$GET_SHIFTS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('driver_id',''))" 2>/dev/null)

[ "$TOTAL" -ge 1 ] 2>/dev/null    && ok "total >= 1 (got: $TOTAL)"                                   || fail "total is 0"
[ "$FOUND" = "True" ]              && ok "completed shift appears in history"                          || fail "shift not found in history"
[ "$DRIVER_ID_IN_RESP" = "$DRIVER_ID" ] && ok "driver_id correct in response"                        || fail "driver_id wrong in response"

# ── SUMMARY ───────────────────────────────────────────────────────────────────
echo ""
echo "=============================="
echo "  Results: ${PASS} passed, ${FAIL} failed"
echo "=============================="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
