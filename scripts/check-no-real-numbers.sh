#!/usr/bin/env bash
# Fails if any amount (>= 1000) from the gitignored data/defaults.local.json appears in a tracked file,
# in plain or thousands-separated form. Public constants listed in scripts/public-numbers.txt and
# single-significant-digit round numbers (e.g. 300000) are allowed.
set -euo pipefail
cd "$(dirname "$0")/.."
LOCAL=data/defaults.local.json
if [ ! -f "$LOCAL" ]; then echo "check:privacy — no $LOCAL, nothing to check"; exit 0; fi
if git check-ignore -q "$LOCAL"; then :; else echo "FAIL: $LOCAL is not gitignored"; exit 1; fi
if git ls-files --error-unmatch "$LOCAL" >/dev/null 2>&1; then echo "FAIL: $LOCAL is tracked"; exit 1; fi
allow=$(grep -v '^#' scripts/public-numbers.txt | tr -d ' ' | grep -v '^$' || true)
nums=$(grep -oE '[0-9]{4,}' "$LOCAL" | sort -u)
fail=0
for n in $nums; do
  if echo "$allow" | grep -qx "$n"; then continue; fi
  # Single-significant-digit round numbers (300000, 1000000) identify nothing; skip them.
  if echo "$n" | grep -qE '^[1-9]0+$'; then continue; fi
  sep=$(echo "$n" | rev | sed 's/\([0-9]\{3\}\)/\1,/g' | rev | sed 's/^,//')
  if hits=$(git grep -nE "(^|[^0-9])($n|$(echo "$sep" | sed 's/,/\\,/g'))([^0-9]|$)" -- . ':!scripts/public-numbers.txt' 2>/dev/null) && [ -n "$hits" ]; then
    echo "FAIL: real amount $n found in tracked files:"; echo "$hits" | head -5; fail=1
  fi
done
if [ $fail -eq 0 ]; then echo "check:privacy OK — no real amounts in tracked files"; fi
exit $fail
