from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import pandas as pd
import json

def scrape_betting_odds():
    # Set up Chrome options
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # Uncomment to run without browser UI
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Initialize the Chrome driver
    print("Initializing Chrome driver...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    try:
        # Navigate to the website
        url = "https://superbet.ro/pariuri-sportive/fotbal/toate"
        print(f"Navigating to {url}...")
        driver.get(url)
        
        # Wait for the page to load completely
        print("Waiting for page to load...")
        time.sleep(10)  # Increased wait time for dynamic content
        
        # Handle cookie consent if it appears
        try:
            cookie_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Acceptă') or contains(@class, 'cookie')]"))
            )
            cookie_button.click()
            print("Accepted cookies.")
            time.sleep(2)  # Give time after clicking
        except Exception as e:
            print(f"Cookie handling: {e}")
            print("Continuing without handling cookies...")
        
        # First run: debug the page structure
        print("\n----- DEBUGGING PAGE STRUCTURE -----")
        
        # Check all divs on the page
        all_divs = driver.find_elements(By.TAG_NAME, "div")
        print(f"Total divs on page: {len(all_divs)}")
        
        # Look for any element containing 'prematch' in its class
        prematch_elements = driver.find_elements(By.XPATH, "//*[contains(@class, 'prematch')]")
        print(f"Elements with 'prematch' in class: {len(prematch_elements)}")
        for i, elem in enumerate(prematch_elements[:5]):  # Show first 5
            print(f"Prematch element {i+1}: {elem.tag_name}, Classes: {elem.get_attribute('class')}")
        
        # Look for any event cards anywhere on the page
        all_event_cards = driver.find_elements(By.CSS_SELECTOR, "div.event-card.e2e-event-row.event-row-container__event")
        print(f"Total event cards found anywhere on page: {len(all_event_cards)}")
        
        # Try alternative selectors for event cards
        alt_event_cards = driver.find_elements(By.CSS_SELECTOR, ".event-card")
        print(f"Event cards with simplified selector: {len(alt_event_cards)}")
        
        # Check for team names anywhere on the page
        team_names = driver.find_elements(By.CSS_SELECTOR, ".event-competitor__name")
        print(f"Team names found anywhere: {len(team_names)}")
        if team_names:
            print("Sample team names:")
            for i, name in enumerate(team_names[:6]):  # Show first 6
                print(f"  {i+1}: {name.text}")
        
        # Main scraping loop
        while True:
            try:
                print("\n----- STARTING NEW SCRAPE CYCLE -----")
                
                # Try multiple approaches to find the prematch container
                prematch_container = None
                
                # Approach 1: Direct CSS selector
                try:
                    print("Approach 1: Looking for div.offer--prematch...")
                    prematch_elements = driver.find_elements(By.CSS_SELECTOR, "div.offer--prematch")
                    if prematch_elements:
                        prematch_container = prematch_elements[0]
                        print("Found prematch container with approach 1!")
                except Exception as e:
                    print(f"Approach 1 failed: {e}")
                
                # Approach 2: XPath contains
                if not prematch_container:
                    try:
                        print("Approach 2: Using XPath contains...")
                        prematch_elements = driver.find_elements(By.XPATH, "//div[contains(@class, 'prematch')]")
                        if prematch_elements:
                            prematch_container = prematch_elements[0]
                            print(f"Found prematch container with approach 2! Class: {prematch_container.get_attribute('class')}")
                    except Exception as e:
                        print(f"Approach 2 failed: {e}")
                
                # Approach 3: Find the parent container of event cards
                if not prematch_container:
                    try:
                        print("Approach 3: Finding parent container of event cards...")
                        event_cards = driver.find_elements(By.CSS_SELECTOR, ".event-card")
                        if event_cards:
                            parent = event_cards[0].find_element(By.XPATH, "./..")
                            grandparent = parent.find_element(By.XPATH, "./..")
                            print(f"Found potential container. Parent class: {parent.get_attribute('class')}, Grandparent class: {grandparent.get_attribute('class')}")
                            prematch_container = grandparent  # Or parent, depending on structure
                    except Exception as e:
                        print(f"Approach 3 failed: {e}")
                
                # If we still don't have a container, use the entire body as fallback
                if not prematch_container:
                    print("WARNING: Could not find specific prematch container. Using body as fallback...")
                    prematch_container = driver.find_element(By.TAG_NAME, "body")
                
                # Now search for event cards within whatever container we found
                print(f"Looking for event cards within found container...")
                
                # Try multiple selectors for event cards
                event_cards = []
                
                # Try the full selector
                full_selector_cards = prematch_container.find_elements(By.CSS_SELECTOR, 
                    "div.event-card.e2e-event-row.event-row-container__event")
                if full_selector_cards:
                    event_cards = full_selector_cards
                    print(f"Found {len(event_cards)} event cards with full selector.")
                else:
                    # Try simplified selector
                    simple_selector_cards = prematch_container.find_elements(By.CSS_SELECTOR, ".event-card")
                    if simple_selector_cards:
                        event_cards = simple_selector_cards
                        print(f"Found {len(event_cards)} event cards with simplified selector.")
                    else:
                        # Try looking for any elements that might contain team names
                        print("Searching for any elements containing team names...")
                        team_elements = prematch_container.find_elements(By.CSS_SELECTOR, 
                            "[class*='team'], [class*='competitor'], [class*='match']")
                        print(f"Found {len(team_elements)} possible team elements.")
                
                if not event_cards:
                    print("No event cards found with any selector. Taking page screenshot for debugging...")
                    driver.save_screenshot("debug_screenshot.png")
                    print("Screenshot saved as debug_screenshot.png")
                    
                    # Save page source for offline analysis
                    with open("page_source.html", "w", encoding="utf-8") as f:
                        f.write(driver.page_source)
                    print("Page source saved as page_source.html")
                    
                    print("Please check these files to understand the page structure.")
                    print("Waiting before next attempt...")
                    time.sleep(60)
                    driver.refresh()
                    time.sleep(10)
                    continue
                
                # Prepare a list to store the data
                betting_data = []
                
                # Extract data from each event card
                for i, card in enumerate(event_cards, 1):
                    try:
                        print(f"Processing event card {i}/{len(event_cards)}...")
                        
                        # Try different approaches to extract team names
                        team1_name = "Unknown"
                        team2_name = "Unknown"
                        
                        # Try the specified selectors first
                        try:
                            team1_elements = card.find_elements(By.CSS_SELECTOR, ".event-competitor__name.e2e-event-team1-name")
                            if team1_elements:
                                team1_name = team1_elements[0].text
                                
                            team2_elements = card.find_elements(By.CSS_SELECTOR, ".event-competitor__name.e2e-event-team2-name")
                            if team2_elements:
                                team2_name = team2_elements[0].text
                        except Exception:
                            pass
                        
                        # If the specified selectors didn't work, try more generic ones
                        if team1_name == "Unknown" or team2_name == "Unknown":
                            try:
                                all_team_elements = card.find_elements(By.CSS_SELECTOR, 
                                    "[class*='team'], [class*='competitor']")
                                if len(all_team_elements) >= 2:
                                    team1_name = all_team_elements[0].text or "Unknown"
                                    team2_name = all_team_elements[1].text or "Unknown"
                            except Exception:
                                pass
                        
                        # Extract odds
                        team1_odds = "N/A"
                        draw_odds = "N/A"
                        team2_odds = "N/A"
                        
                        # Try multiple approaches for odds
                        
                        # Approach 1: The exact selector provided
                        try:
                            odds_1_elements = card.find_elements(By.XPATH, 
                                ".//div[./span[text()='1']]//span[@class='odd-button__odd-value-new e2e-odd-current-value']")
                            if odds_1_elements:
                                team1_odds = odds_1_elements[0].text
                                
                            odds_x_elements = card.find_elements(By.XPATH, 
                                ".//div[./span[text()='X']]//span[@class='odd-button__odd-value-new e2e-odd-current-value']")
                            if odds_x_elements:
                                draw_odds = odds_x_elements[0].text
                                
                            odds_2_elements = card.find_elements(By.XPATH, 
                                ".//div[./span[text()='2']]//span[@class='odd-button__odd-value-new e2e-odd-current-value']")
                            if odds_2_elements:
                                team2_odds = odds_2_elements[0].text
                        except Exception:
                            pass
                        
                        # Approach 2: More generic selectors
                        if team1_odds == "N/A" or draw_odds == "N/A" or team2_odds == "N/A":
                            try:
                                all_odds_elements = card.find_elements(By.CSS_SELECTOR, 
                                    "[class*='odd-value'], [class*='odd-button']")
                                
                                if len(all_odds_elements) >= 3:
                                    team1_odds = all_odds_elements[0].text or "N/A"
                                    draw_odds = all_odds_elements[1].text or "N/A"
                                    team2_odds = all_odds_elements[2].text or "N/A"
                            except Exception:
                                pass
                        
                        # Append the data to our list
                        betting_data.append({
                            'Team 1': team1_name,
                            'Team 2': team2_name,
                            'Team 1 Odds': team1_odds,
                            'Draw Odds': draw_odds,
                            'Team 2 Odds': team2_odds
                        })
                        
                        print(f"Extracted data for {team1_name} vs {team2_name}")
                        
                    except Exception as e:
                        print(f"Error extracting data from card {i}: {e}")
                
                # Convert the data to a DataFrame
                df = pd.DataFrame(betting_data)
                
                # Save to CSV, overwriting any existing file
                if not df.empty:
                    # Display the data
                    print("\nScraped Betting Odds:")
                    print(df)
                    
                    # Save to CSV (overwriting existing file)
                    df.to_csv("betting_odds.csv", index=False, mode='w')
                    print(f"\nData saved to betting_odds.csv at {time.strftime('%Y-%m-%d %H:%M:%S')}")
                else:
                    print("No data was scraped.")
                
                # Wait for 60 seconds before the next scrape
                print("\nWaiting 60 seconds before next scrape...")
                time.sleep(60)
                
                # Refresh the page to get updated odds
                driver.refresh()
                print("Page refreshed.")
                time.sleep(10)  # Increased wait time after refresh
                
            except Exception as e:
                print(f"An error occurred during scraping: {e}")
                print("Will try again in 60 seconds...")
                time.sleep(60)
                
                # Refresh the page
                driver.refresh()
                time.sleep(10)
        
    except KeyboardInterrupt:
        print("\nScript terminated by user.")
        
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        
    finally:
        # Close the browser
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    print("Starting betting odds scraper with debugging...")
    print("Press Ctrl+C to stop the script.")
    scrape_betting_odds()