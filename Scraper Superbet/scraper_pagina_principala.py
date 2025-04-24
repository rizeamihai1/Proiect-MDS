import csv
import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def scroll_to_bottom_and_extract(driver, writer, seen,
                                 scroll_pixels=300, scroll_pause=1.0):
    """
    Scrollează fereastra în jos până la capăt, extrăgând
    imediat meciurile noi vizibile și scriindu-le în CSV.
    Când atinge finalul paginii, așteaptă 1s și se oprește.
    """
    total_written = 0

    while True:
        # Extrage toate rândurile vizibile
        rows = driver.find_elements(By.CSS_SELECTOR, '.event-row-container')
        for row in rows:
            try:
                main = row.find_element(By.CSS_SELECTOR, '.event-card__main-content')

                # Data meciului
                try:
                    date_text = main.find_element(
                        By.CSS_SELECTOR, '.event-card-label .capitalize'
                    ).text.strip()
                except:
                    date_text = main.find_element(
                        By.CSS_SELECTOR, '.event-card-label'
                    ).text.strip()

                # Echipele
                team1 = main.find_element(
                    By.CSS_SELECTOR, '.event-competitor__name.e2e-event-team1-name'
                ).text.strip()
                team2 = main.find_element(
                    By.CSS_SELECTOR, '.event-competitor__name.e2e-event-team2-name'
                ).text.strip()

                key = (date_text, team1, team2)
                if key not in seen:
                    seen.add(key)
                    writer.writerow({
                        'date': date_text,
                        'team1': team1,
                        'team2': team2
                    })
                    print(f"Added: \"{date_text}\",{team1},{team2}")
                    total_written += 1
            except:
                continue

        # Scroll în jos și așteaptă puțin
        driver.execute_script(f"window.scrollBy(0, {scroll_pixels});")
        time.sleep(scroll_pause)

        # Verifică dacă am ajuns jos
        at_bottom = driver.execute_script(
            "return window.innerHeight + window.pageYOffset >= document.body.scrollHeight;"
        )
        if at_bottom:
            # Așteaptă încă 1s înainte de a opri programul
            time.sleep(1)
            break

    return total_written

def main():
    # --- Setup Chrome ---
    opts = webdriver.ChromeOptions()
    # opts.add_argument('--headless')  # poți comenta/decomenta după preferință
    opts.add_argument('--disable-gpu')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    opts.add_argument('window-size=1920,1080')

    driver = webdriver.Chrome(options=opts)
    wait = WebDriverWait(driver, 20)

    url = 'https://superbet.ro/pariuri-sportive/fotbal/toate'
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

    # --- Pregătește CSV-ul ---
    csv_path = os.path.join(os.getcwd(), 'all_football_matches.csv')
    first = not os.path.exists(csv_path)
    seen = set()
    with open(csv_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['date', 'team1', 'team2'])
        if first:
            writer.writeheader()

        # --- Scroll până jos + extragere ---
        written = scroll_to_bottom_and_extract(
            driver, writer, seen,
            scroll_pixels=10000,
            scroll_pause=0.01
        )
        print(f"Scraping complete. {written} new matches added.")

    driver.quit()

if __name__ == '__main__':
    main()
