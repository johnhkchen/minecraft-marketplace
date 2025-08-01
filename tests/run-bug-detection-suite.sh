#!/bin/bash

# Comprehensive Bug Detection Suite
# Runs all tests designed to catch API fallback to synthetic data bugs

echo "🎯 Running Comprehensive Bug Detection Suite"
echo "=============================================="

# Track results
TOTAL_TESTS=0
FAILED_TESTS=0
DETECTION_RESULTS=""

run_test_suite() {
    local suite_name="$1"
    local command="$2"
    local timeout_duration="$3"
    
    echo ""
    echo "🔍 Running $suite_name..."
    echo "Command: $command"
    echo "Timeout: ${timeout_duration}s"
    echo "----------------------------------------"
    
    if timeout "${timeout_duration}s" $command; then
        echo "✅ $suite_name: PASSED"
        DETECTION_RESULTS="$DETECTION_RESULTS\n✅ $suite_name: PASSED"
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            echo "❌ $suite_name: TIMEOUT (${timeout_duration}s)"
            DETECTION_RESULTS="$DETECTION_RESULTS\n❌ $suite_name: TIMEOUT"
        else
            echo "❌ $suite_name: FAILED (exit code: $exit_code)"
            DETECTION_RESULTS="$DETECTION_RESULTS\n❌ $suite_name: FAILED"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# 1. Unit Level Detection (fastest)
run_test_suite \
    "Unit: API Failure Patterns" \
    "npx vitest run tests/unit/api-failure-patterns.fast.test.ts" \
    10

# 2. Integration Level Detection
run_test_suite \
    "Integration: Homepage Data Root Cause" \
    "npx vitest run tests/integration/homepage-data-integration.test.ts" \
    15

run_test_suite \
    "Unit: Homepage API Root Cause" \
    "npx vitest run tests/unit/homepage-api-root-cause.fast.test.ts" \
    10

# 3. E2E Level Detection
run_test_suite \
    "E2E: API Fallback Detection" \
    "npx playwright test tests/e2e/api-fallback-detection.spec.ts --project=chromium --config config/testing/playwright.config.ts" \
    15

run_test_suite \
    "E2E: Homepage Performance Validation" \
    "npx playwright test tests/e2e/homepage-performance-validation.spec.ts --project=chromium --config config/testing/playwright.config.ts" \
    15

# 4. Comprehensive Analysis
run_test_suite \
    "Validation: Comprehensive Bug Detection" \
    "npx vitest run tests/validation/comprehensive-bug-detection.test.ts" \
    10

# Summary
echo ""
echo "🎯 BUG DETECTION SUITE SUMMARY"
echo "=============================================="
echo -e "$DETECTION_RESULTS"
echo ""
echo "📊 Results: $((TOTAL_TESTS - FAILED_TESTS))/$TOTAL_TESTS test suites passed"

if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ ALL DETECTION SUITES PASSED"
    echo "🛡️ The bug detection system is working correctly"
    exit 0
else
    echo "❌ $FAILED_TESTS/$TOTAL_TESTS detection suites failed"
    echo "⚠️ Bug detection coverage may be compromised"
    exit 1
fi