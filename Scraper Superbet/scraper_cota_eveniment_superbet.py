import csv
import time
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def scrape_odds(var1: str, var2: str, output_csv: str = 'odds.csv'):
    # 1) Encode var1 (spații → %20)
    query = quote(var1)
    url = f"https://superbet.ro/cautare?query={query}"

    # 2) Setup Chrome
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')  # dezactivează UI dacă vrei
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('window-size=1920,1080')

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    try:
        driver.get(url)

        # --- Acceptă cookie-banner ---
        try:
            cookie_btn = wait.until(EC.element_to_be_clickable(
                (By.ID, 'onetrust-accept-btn-handler')
            ))
            cookie_btn.click()
            print("🟢 Cookies accepted")
            time.sleep(1)
        except:
            print("⚪ No cookie prompt (or already accepted)")

        # --- Mic scroll pentru modal ---
        driver.execute_script("window.scrollBy(0, 100);")
        time.sleep(0.1)

        # --- Închide modalul dacă există ---
        try:
            close_btn = wait.until(EC.element_to_be_clickable(
                (By.CSS_SELECTOR, 'button.e2e-close-modal')
            ))
            close_btn.click()
            print("🟢 Modal closed")
            time.sleep(0.1)
        except:
            print("⚪ No modal to close")

        # 3) Găsește toate evenimentele
        events = driver.find_elements(By.CSS_SELECTOR,
            "div.event-card.e2e-event-row.event-row-container__event"
        )

        # 4) Scrie CSV header
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['team1', 'team2', 'odd_1', 'odd_X', 'odd_2'])

            # 5) Parcurge evenimentele și extrage cotele
            for ev in events:
                try:
                    # ierarhie exactă pentru numele echipei 2
                    team2 = ev.find_element(
                        By.CSS_SELECTOR,
                        ".event-card__main-content .event__sections .event__competitors-section .event-competitor .event-competitor__name.e2e-event-team2-name"
                    ).text.strip()
                except:
                    continue

                if team2.lower() == var2.lower():
                    team1 = ev.find_element(
                        By.CSS_SELECTOR,
                        ".event-card__main-content .event__sections .event__competitors-section .event-competitor .event-competitor__name.e2e-event-team1-name"
                    ).text.strip()

                    # extrage cele 3 cote 1, X, 2
                    buttons = ev.find_elements(
                        By.CSS_SELECTOR,
                        "div.odd-offer__odd-button.e2e-odd-pick"
                    )
                    odds = {'1': None, 'X': None, '2': None}
                    for btn in buttons:
                        name = btn.find_element(
                            By.CSS_SELECTOR,
                            "span.odd-button__odd-name.e2e-odd-name"
                        ).text.strip()
                        value = btn.find_element(
                            By.CSS_SELECTOR,
                            "span.odd-button__odd-current-value.e2e-odd-current-value"
                        ).text.strip()
                        if name in odds:
                            odds[name] = value

                    print(f"Found {team1} vs {team2} → 1: {odds['1']}, X: {odds['X']}, 2: {odds['2']}")
                    writer.writerow([team1, team2, odds['1'], odds['X'], odds['2']])
    finally:
        driver.quit()


if __name__ == "__main__":
    # Exemplu de rulare
    scrape_odds("Atletico Madrid","Rayo Vallecano", "real_vs_barca_odds.csv")
