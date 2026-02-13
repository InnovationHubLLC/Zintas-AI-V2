#!/usr/bin/env bash
set -euo pipefail

# Zintas AI — Production Environment Verification
# Run: bash scripts/setup-production.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
  local name="$1"
  local value="$2"
  if [ -n "$value" ]; then
    echo -e "  ${GREEN}✓${NC} $name"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $name"
    ((FAIL++))
  fi
}

echo ""
echo "========================================="
echo "  Zintas AI — Production Readiness Check"
echo "========================================="
echo ""

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo -e "${GREEN}Loaded .env file${NC}"
else
  echo -e "${YELLOW}No .env file found — using environment variables${NC}"
fi
echo ""

# --- Clerk ---
echo "Clerk Authentication:"
check "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}"
check "CLERK_SECRET_KEY" "${CLERK_SECRET_KEY:-}"
echo ""

# --- Supabase ---
echo "Supabase:"
check "NEXT_PUBLIC_SUPABASE_URL" "${NEXT_PUBLIC_SUPABASE_URL:-}"
check "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
check "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_ROLE_KEY:-}"
echo ""

# --- AI ---
echo "AI / LLM:"
check "ANTHROPIC_API_KEY" "${ANTHROPIC_API_KEY:-}"
echo ""

# --- SEO ---
echo "SEO Tools:"
check "SE_RANKING_API_KEY" "${SE_RANKING_API_KEY:-}"
echo ""

# --- Google ---
echo "Google Integration:"
check "GOOGLE_CLIENT_ID" "${GOOGLE_CLIENT_ID:-}"
check "GOOGLE_CLIENT_SECRET" "${GOOGLE_CLIENT_SECRET:-}"
check "GOOGLE_REDIRECT_URI" "${GOOGLE_REDIRECT_URI:-}"
echo ""

# --- Redis ---
echo "Redis (Upstash):"
check "UPSTASH_REDIS_REST_URL" "${UPSTASH_REDIS_REST_URL:-}"
check "UPSTASH_REDIS_REST_TOKEN" "${UPSTASH_REDIS_REST_TOKEN:-}"
echo ""

# --- Email ---
echo "Email (Resend):"
check "RESEND_API_KEY" "${RESEND_API_KEY:-}"
echo ""

# --- Security ---
echo "Security:"
check "RECAPTCHA_SECRET_KEY" "${RECAPTCHA_SECRET_KEY:-}"
check "ENCRYPTION_KEY" "${ENCRYPTION_KEY:-}"
check "AGENT_API_KEY" "${AGENT_API_KEY:-}"
echo ""

# --- App ---
echo "App:"
check "NEXT_PUBLIC_APP_URL" "${NEXT_PUBLIC_APP_URL:-}"
echo ""

# --- Connectivity Tests ---
echo "Service Connectivity:"

# Supabase health
if [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo -e "  ${GREEN}✓${NC} Supabase reachable (HTTP $HTTP_CODE)"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} Supabase unreachable (HTTP $HTTP_CODE)"
    ((FAIL++))
  fi
else
  echo -e "  ${YELLOW}-${NC} Supabase connectivity skipped (no URL)"
fi

# Upstash Redis health
if [ -n "${UPSTASH_REDIS_REST_URL:-}" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${UPSTASH_REDIS_REST_URL}/ping" \
    -H "Authorization: Bearer ${UPSTASH_REDIS_REST_TOKEN:-}" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo -e "  ${GREEN}✓${NC} Upstash Redis reachable (HTTP $HTTP_CODE)"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} Upstash Redis unreachable (HTTP $HTTP_CODE)"
    ((FAIL++))
  fi
else
  echo -e "  ${YELLOW}-${NC} Redis connectivity skipped (no URL)"
fi

echo ""
echo "========================================="
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "========================================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}Some checks failed. Fix the issues above before deploying.${NC}"
  exit 1
else
  echo -e "${GREEN}All checks passed. Ready for production deployment.${NC}"
  exit 0
fi
