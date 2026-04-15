#!/bin/bash

# PCMS GitIgnore Verification Script
# Verifies tracked/staged files do not include local artifacts or secrets.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

echo "=========================================="
echo "  PCMS GitIgnore Verification"
echo "=========================================="
echo ""

# Patterns that should never be tracked or staged.
forbidden_regex='(^|/)(\.env(\..*)?$|\.env\.local$|node_modules/|\.next/|dist/|build/|coverage/|test-results/|playwright-report/)|\.(log|sqlite3?|db|pem)$'

issues=0

check_paths() {
  local label="$1"
  local paths="$2"
  if [ -z "$paths" ]; then
    print_success "$label: clean"
    return
  fi

  local bad
  bad=$(printf '%s\n' "$paths" | awk 'NF' | grep -E "$forbidden_regex" || true)
  if [ -n "$bad" ]; then
    print_error "$label contains forbidden files:"
    printf '%s\n' "$bad"
    issues=$((issues + 1))
  else
    print_success "$label: clean"
  fi
}

print_status "Checking tracked files..."
tracked_files=$(git ls-files)
check_paths "Tracked files" "$tracked_files"

print_status "Checking staged files..."
staged_files=$(git diff --cached --name-only)
check_paths "Staged files" "$staged_files"

print_status "Checking .gitignore baseline patterns..."
essential_patterns=(
  ".env.local"
  "node_modules"
  ".next"
  "coverage/"
  "test-results/"
  "playwright-report/"
)

missing=0
for pattern in "${essential_patterns[@]}"; do
  local_pat="${pattern%/}"
  if ! grep -Fq "$local_pat" ".gitignore"; then
    print_warning "Missing .gitignore pattern: $pattern"
    missing=$((missing + 1))
  fi
done

if [ "$missing" -gt 0 ]; then
  issues=$((issues + 1))
fi

echo ""
if [ "$issues" -eq 0 ]; then
  print_success "GitIgnore verification passed."
  exit 0
fi

print_error "GitIgnore verification failed with $issues issue group(s)."
exit 1
