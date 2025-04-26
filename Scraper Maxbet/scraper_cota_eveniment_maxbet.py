import csv
import time
import os
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def init_csv(filename):
    """
    Creează fișierul CSV cu antetul dacă nu există deja.
    """
    try:
        with open(filename, 'x', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Data", "team1", "team2", "odd_1", "odd_X", "odd_2"])
    except FileExistsError:
        pass  # fișierul există deja

def write_match_to_csv(filename, date, team1, team2, odds):
    """
    Adaugă un rând în CSV cu datele meciului găsit.
    """
    with open(filename, 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([date, team1, team2, odds['1'], odds['X'], odds['2']])

def scrape_odds(string_data: str, team_name1: str, team_name2: str, scroll_pause: float = 1.0, max_scrolls: int = 50):
    """
    Accesează MaxBet, parchează pagina, dă scroll până la încărcarea completă și
    caută un meci cu data și echipele specificate; dacă e găsit, îl salvează în CSV.
    """
    # inițializează CSV-ul de output
    output_file = 'maxbet_cota.csv'
    init_csv(output_file)

    url = "https://www.maxbet.ro/ro/pariuri-sportive?sport=2"
    options = webdriver.ChromeOptions()
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('window-size=1920,1080')
    options.add_experimental_option("prefs", {"profile.default_content_setting_values.notifications": 2})

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    try:
        print(f"🌐 Deschid pagina: {url}")
        driver.get(url)

        # Închide pop-up notificări interne
        try:
            later_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH,
                    "//*[translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='poate mai târziu']"
                ))
            )
            later_btn.click()
            time.sleep(0.5)
        except:
            pass

        # Acceptă cookies (fallback)
        try:
            cook_btn = driver.find_element(
                By.XPATH,
                "//button[contains(translate(., 'ĂÂÎȘȚ','ÂÎȘȚĂ'), 'Acceptă cookies')]"
            )
            cook_btn.click()
            time.sleep(0.5)
        except:
            pass

        # Activează filtru "Toate"
        try:
            toate_btn = wait.until(EC.element_to_be_clickable((
                By.XPATH,
                "//div[contains(@class,'filter-container')]//div[contains(@class,'filter-item') and normalize-space()='Toate']"
            )))
            toate_btn.click()
            time.sleep(1)
        except:
            pass

        # Scroll pentru a încărca tot
        last_height = driver.execute_script("return document.body.scrollHeight")
        for _ in range(max_scrolls):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(scroll_pause)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        # Găsește evenimentele
        wait.until(EC.presence_of_element_located((By.TAG_NAME, 'event')))
        matches = driver.find_elements(By.TAG_NAME, 'event')
        print(f"🔍 Găsite {len(matches)} evenimente")

        # Parcurge fiecare meci
        for idx, match in enumerate(matches, start=1):
            # Extrage data
            try:
                full_time = match.find_element(By.CSS_SELECTOR, 'div.event__header div.time').text.strip()
                formatted_dt = full_time.splitlines()[0]
            except:
                formatted_dt = ''

            # Extrage echipele
            comps = match.find_element(By.CSS_SELECTOR, 'div.event__wrapper div.general__competitors').text.strip()
            team1, team2 = comps.splitlines()

            # Extrage cote
            try:
                odd_spans = match.find_elements(
                    By.CSS_SELECTOR, 'div.market__wrapper .market__outcome span.outcome.centered'
                )[:3]
                odds_list = [s.text.strip() for s in odd_spans]
            except:
                odds_list = ['', '', '']
            c1, cX, c2 = (odds_list + ['', '', ''])[:3]
            odds = {'1': c1, 'X': cX, '2': c2}

            # Verifică condiția și scrie în CSV
            if (formatted_dt == string_data
                    and team1.lower() == team_name1.lower()
                    and team2.lower() == team_name2.lower()):
                print(f"⚽ Meci găsit: {team1} vs {team2} la {formatted_dt} "
                      f"cu cote: 1={c1}  X={cX}  2={c2}")
                write_match_to_csv(output_file, formatted_dt, team1, team2, odds)
                return  # oprește căutarea după primul meci găsit

        print("❌ Niciun meci nu a îndeplinit condițiile.")

    finally:
        driver.quit()

if __name__ == '__main__':
    # Exemplu de utilizare; înlocuiește cu valorile dorite
    string_data   = '27/04'      # data meciului în formatul afișat pe site
    team_name1    = 'Rapid B.'  # nume echipa 1
    team_name2    = 'FCSB' # nume echipa 2
    scrape_odds(string_data, team_name1, team_name2)
