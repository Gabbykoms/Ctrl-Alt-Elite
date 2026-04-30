#!/usr/bin/env bash
# Stops CRUD test script — run with: bash scripts/test_stops.sh
set -e

BASE="http://localhost:8081"
PASS=0
FAIL=0

ok()   { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

# ── 1. CREATE ─────────────────────────────────────────────────────────────────
echo ""
echo "=== 1. POST /v1/stops — create stop ==="
CREATE=$(curl -s -X POST "$BASE/v1/stops" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Library",
    "latitude": 41.2010,
    "longitude": -72.5740,
    "description": "Near main library entrance"
  }')
echo "$CREATE" | python3 -m json.tool

STOP_ID=$(echo "$CREATE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
IS_ACTIVE=$(echo "$CREATE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('is_active',''))" 2>/dev/null)
CREATED_AT_MS=$(echo "$CREATE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('created_at_ms',''))" 2>/dev/null)

[ -n "$STOP_ID" ]        && ok "id returned (${STOP_ID})"              || fail "id missing"
[ "$IS_ACTIVE" = "True" ] && ok "is_active=true"                        || fail "is_active not true (got: $IS_ACTIVE)"
[ -n "$CREATED_AT_MS" ]  && ok "created_at_ms populated (${CREATED_AT_MS})" || fail "created_at_ms missing"

# ── 2. GET ALL ────────────────────────────────────────────────────────────────
echo ""
echo "=== 2. GET /v1/stops — get all active stops ==="
GET_ALL=$(curl -s "$BASE/v1/stops")
echo "$GET_ALL" | python3 -m json.tool

TOTAL=$(echo "$GET_ALL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total',0))" 2>/dev/null)
FOUND=$(echo "$GET_ALL" | python3 -c "
import sys,json
d=json.load(sys.stdin)
stops=d.get('stops',[])
print(any(s.get('id')=='${STOP_ID}' for s in stops))
" 2>/dev/null)

[ "$TOTAL" -ge 1 ] 2>/dev/null  && ok "total >= 1 (got: $TOTAL)"            || fail "total is 0"
[ "$FOUND" = "True" ]            && ok "created stop is in active list"       || fail "created stop not found in list"

# ── 3. GET BY ID ──────────────────────────────────────────────────────────────
echo ""
echo "=== 3. GET /v1/stops/${STOP_ID} — get by ID ==="
GET_ONE=$(curl -s "$BASE/v1/stops/${STOP_ID}")
echo "$GET_ONE" | python3 -m json.tool

GOT_ID=$(echo "$GET_ONE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
[ "$GOT_ID" = "$STOP_ID" ] && ok "correct stop returned" || fail "wrong stop (got: $GOT_ID)"

# ── 4. GET NON-EXISTENT (404) ─────────────────────────────────────────────────
echo ""
echo "=== 4. GET /v1/stops/does-not-exist — expect 404 ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/stops/does-not-exist")
echo "  HTTP status: $STATUS"
[ "$STATUS" = "404" ] && ok "404 for missing stop" || fail "expected 404, got $STATUS"

# ── 5. CREATE — missing required fields (400) ─────────────────────────────────
echo ""
echo "=== 5. POST /v1/stops — missing lat/lon, expect 400 ==="
BAD=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/stops" \
  -H "Content-Type: application/json" \
  -d '{"name":"No Coords"}')
BAD_STATUS=$(echo "$BAD" | tail -1)
BAD_BODY=$(echo "$BAD" | head -1)
echo "  HTTP status: $BAD_STATUS"
echo "  Body: $BAD_BODY"
[ "$BAD_STATUS" = "400" ] && ok "400 for missing lat/lon" || fail "expected 400, got $BAD_STATUS"

# ── 6. UPDATE ─────────────────────────────────────────────────────────────────
echo ""
echo "=== 6. PUT /v1/stops/${STOP_ID} — update name and description ==="
UPDATED_AT_MS_BEFORE="$CREATED_AT_MS"
UPDATE=$(curl -s -X PUT "$BASE/v1/stops/${STOP_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Library (Updated)",
    "description": "Updated — now includes north entrance"
  }')
echo "$UPDATE" | python3 -m json.tool

UPD_NAME=$(echo "$UPDATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('name',''))" 2>/dev/null)
UPD_AT_MS=$(echo "$UPDATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('updated_at_ms',0))" 2>/dev/null)

[ "$UPD_NAME" = "Main Library (Updated)" ] && ok "name updated"                                     || fail "name not updated (got: $UPD_NAME)"
[ "$UPD_AT_MS" -gt "$UPDATED_AT_MS_BEFORE" ] 2>/dev/null && ok "updated_at_ms advanced"            || fail "updated_at_ms did not advance"

# ── 7. UPDATE NON-EXISTENT (404) ─────────────────────────────────────────────
echo ""
echo "=== 7. PUT /v1/stops/does-not-exist — expect 404 ==="
UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/v1/stops/does-not-exist" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ghost"}')
echo "  HTTP status: $UPD_STATUS"
[ "$UPD_STATUS" = "400" ] || [ "$UPD_STATUS" = "404" ] && ok "non-2xx for missing stop" || fail "expected error, got $UPD_STATUS"

# ── 8. SOFT DELETE ────────────────────────────────────────────────────────────
echo ""
echo "=== 8. DELETE /v1/stops/${STOP_ID} — soft delete ==="
DEL=$(curl -s -X DELETE "$BASE/v1/stops/${STOP_ID}")
echo "$DEL" | python3 -m json.tool

DEL_MSG=$(echo "$DEL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)
[ "$DEL_MSG" = "Stop deleted successfully" ] && ok "delete response correct" || fail "unexpected delete message (got: $DEL_MSG)"

# ── 9. VERIFY REMOVED FROM ACTIVE LIST ───────────────────────────────────────
echo ""
echo "=== 9. GET /v1/stops — deleted stop should not appear ==="
GET_AFTER=$(curl -s "$BASE/v1/stops")
STILL_THERE=$(echo "$GET_AFTER" | python3 -c "
import sys,json
d=json.load(sys.stdin)
stops=d.get('stops',[])
print(any(s.get('id')=='${STOP_ID}' for s in stops))
" 2>/dev/null)
[ "$STILL_THERE" = "False" ] && ok "deleted stop removed from active list" || fail "deleted stop still in active list"

# ── 10. GET DELETED STOP BY ID (still retrievable) ───────────────────────────
echo ""
echo "=== 10. GET /v1/stops/${STOP_ID} — deleted stop is still retrievable (is_active=false) ==="
DEL_GET=$(curl -s "$BASE/v1/stops/${STOP_ID}")
echo "$DEL_GET" | python3 -m json.tool
DEL_ACTIVE=$(echo "$DEL_GET" | python3 -c "import sys,json; print(json.load(sys.stdin).get('is_active',''))" 2>/dev/null)
[ "$DEL_ACTIVE" = "False" ] && ok "is_active=false after delete" || fail "is_active not false (got: $DEL_ACTIVE)"

# ── SUMMARY ───────────────────────────────────────────────────────────────────
echo ""
echo "=============================="
echo "  Results: ${PASS} passed, ${FAIL} failed"
echo "=============================="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
