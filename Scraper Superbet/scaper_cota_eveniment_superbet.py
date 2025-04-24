import csv
import time
import os
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def scrape_odds(var1: str, var2: str, output_csv: str = 'odds.csv'):
    """
    Accesează pagina de căutare Superbet pentru var1 vs var2
    și salvează cotele 1, X, 2 în CSV.
    """
    # Construiește URL encoded
    query = quote(var1)
    url = f"https://superbet.ro/cautare?query={query}"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, output_csv)
    
    # Setup Selenium
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    try:
        driver.get(url)

        # Acceptă cookie-banner
        try:
            btn = wait.until(EC.element_to_be_clickable((By.ID, 'onetrust-accept-btn-handler')))
            btn.click()
            print("🟢 Cookies accepted")
            time.sleep(0.5)
        except:
            print("⚪ No cookie prompt or already accepted")

        # mic scroll ca să încarce secțiunea de cote
        driver.execute_script("window.scrollBy(0, 200);")
        time.sleep(0.5)

        # Așteaptă ca secțiunea de cote să fie prezentă
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.odd-offer.event-card__odd-offer")))

        # Găsește toate card-urile de eveniment
        events = driver.find_elements(By.CSS_SELECTOR, "div.event-card.e2e-event-row.event-row-container__event")
        print(f"🔍 Found {len(events)} events on search page")

        # Deschide CSV
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['team1', 'team2', 'odd_1', 'odd_X', 'odd_2'])

            for ev in events:
                # extrage echipele
                try:
                    team1 = ev.find_element(By.CSS_SELECTOR,
                        ".event-card__main-content .event-competitor__name.e2e-event-team1-name"
                    ).text.strip()
                    team2 = ev.find_element(By.CSS_SELECTOR,
                        ".event-card__main-content .event-competitor__name.e2e-event-team2-name"
                    ).text.strip()
                except:
                    continue
                
                print(f"Found match: '{team1}' vs '{team2}' Comparing with: '{var1}' vs '{var2}'")
                if not (team1.lower() == var1.lower() and team2.lower() == var2.lower()):
                    print("⛔ Teams do not match, skipping")
                    continue
                print("✅ Teams match!")

                # găsește secțiunea de cote
                try:
                    odd_offer = ev.find_element(By.CSS_SELECTOR, "div.odd-offer.event-card__odd-offer")
                    buttons_wrapper = odd_offer.find_element(By.CSS_SELECTOR, "div.odd-offer__buttons div.odd-offer__odd-buttons-wrapper")
                    odd_buttons = buttons_wrapper.find_elements(By.CSS_SELECTOR, "div.odd-offer__odd-button.e2e-odd-pick")
                except Exception as e:
                    # print(f"⚠️ No odd buttons structure found: {e}")
                    continue

                odds = {'1': None, 'X': None, '2': None}
                for btn in odd_buttons:
                    try:
                        # identifică tipul cotei
                        odd_type = btn.find_element(By.CSS_SELECTOR, ".odd-button__odd-name.e2e-odd-name").text.strip()
                        # valoarea cotei este în span.new
                        odd_val = btn.find_element(By.CSS_SELECTOR, ".odd-button__odd-value-new.e2e-odd-current-value").text.strip()
                        odds[odd_type] = odd_val
                        print(f"   • Found odd {odd_type}: {odd_val}")
                    except Exception as e:
                        print(f"   ⚠️ Error extracting odd: {e}")

                if None in odds.values():
                    print(f"⚠️ Some odds missing: {odds}")
                writer.writerow([team1, team2, odds['1'], odds['X'], odds['2']])

    finally:
        driver.quit()

# _nu modifica asta_
if __name__ == "__main__":
    scrape_odds("Barcelona", "Real Madrid", "real_vs_barca_odds.csv")
