import re
from datetime import datetime, date, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import csv


# Parser de date în română
REF_DATE = date.today()

WEEKDAY_MAP = {
    'Luni': 0, 'Marti': 1, 'Miercuri': 2, 'Joi': 3,
    'Vineri': 4, 'sâm': 5, 'Sâmbătă': 5, 'Duminică': 6
}
MONTHS_RO = {
    'ianuarie': 1, 'februarie': 2, 'martie': 3, 'aprilie': 4,
    'mai': 5, 'iunie': 6, 'iulie': 7, 'august': 8,
    'septembrie': 9, 'octombrie': 10, 'noiembrie': 11, 'decembrie': 12
}

def write_match_to_csv(filename, date_str, team1, team2, odds):
    with open(filename, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([date_str, team1, team2, odds['1'], odds['X'], odds['2']])

def parse_match_datetime(s: str, ref_date: date = REF_DATE) -> datetime:
    s = s.strip()
    low = s.lower()

    # Caz: "astăzi, 15:30"
    m = re.match(r'^(?:astăzi|azi)\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        hh, mm = map(int, m.groups())
        return datetime(ref_date.year, ref_date.month, ref_date.day, hh, mm)

    # Caz: "mâine, 15:15"
    m = re.match(r'^mâine\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        hh, mm = map(int, m.groups())
        tomorrow = ref_date + timedelta(days=1)
        return datetime(tomorrow.year, tomorrow.month, tomorrow.day, hh, mm)

    # Caz: "03.05, 16:00"
    m = re.match(r'^(\d{1,2})\.(\d{1,2})\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        d, mo, hh, mm = map(int, m.groups())
        return datetime(ref_date.year, mo, d, hh, mm)

    # Caz: "mie. 30, 22:00"
    m = re.match(r'^([^\d,\.]+)\.?\s*(\d{1,2})\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        wd_abbr, day_str, hh_str, mm_str = m.groups()
        day = int(day_str)
        hh = int(hh_str)
        mm = int(mm_str)
        mo = ref_date.month
        yr = ref_date.year
        if day < ref_date.day:
            if mo == 12:
                mo = 1
                yr += 1
            else:
                mo += 1
        return datetime(yr, mo, day, hh, mm)

    # 🆕 Caz: "Miercuri 30 Aprilie 2025, 22:00"
    m = re.match(r'^[A-Za-zăâîșț]+ \s*(\d{1,2}) (\w+)\s+(\d{4})\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        day, month_name, year, hh, mm = m.groups()
        mo = MONTHS_RO.get(month_name)
        if not mo:
            raise ValueError(f"Lună necunoscută: '{month_name}'")
        return datetime(int(year), mo, int(day), int(hh), int(mm))

    raise ValueError(f"Unrecognized date format: '{s}'")

def init_csv(filename):
    try:
        with open(filename, 'x', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Data", "team1", "team2", "odd_1", "odd_X", "odd_2"])
    except FileExistsError:
        pass  # fișierul există deja


def scrape_matches_with_odds(team_name1, team_name2, string_data, timeout=10, char_delay=0.15, pre_type_delay=0.5, post_type_delay=1.0):
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, timeout)

    try:
        driver.get("https://spin.ro/sport")

        try:
            dlg = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "div.osano-cm-dialog--type_bar")))
            dlg.find_element(By.CSS_SELECTOR, "button.osano-cm-accept-all").click()
            wait.until(EC.invisibility_of_element(dlg))
        except TimeoutException:
            pass

        inp = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.widget-ricerca-side input#match-search-input")))
        inp.click()
        time.sleep(pre_type_delay)
        driver.execute_script("arguments[0].value = '';", inp)
        for ch in team_name1:
            inp.send_keys(ch)
            time.sleep(char_delay)
        inp.send_keys(Keys.ENTER)
        time.sleep(post_type_delay)

        try:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.contenitoreRiga")))
        except TimeoutException:
            print("Niciun meci găsit pentru:", team_name1, team_name2)
            return

        rows = driver.find_elements(By.CSS_SELECTOR, "div.contenitoreRiga")
        for row in rows:
            try:
                tempo = row.find_element(By.CSS_SELECTOR, "div.tabellaQuoteTempo")
                date_text = tempo.find_element(By.CSS_SELECTOR, "span.tabellaQuoteTempo__data").text
                hour_text = tempo.find_element(By.CSS_SELECTOR, "span.tabellaQuoteTempo__ora").text
                full_date_str = f"{date_text}, {hour_text}"
                try:
                    parsed_datetime = parse_match_datetime(full_date_str)
                    formatted_dt = parsed_datetime.strftime("%d/%m/%Y %H:%M")
                except ValueError:
                    formatted_dt = f"[Eroare] {full_date_str}"
            except NoSuchElementException:
                formatted_dt = "–"

            try:
                team1 = row.find_element(By.CSS_SELECTOR, "p.font-weight-bold.m-0.text-right").text
                team2 = row.find_element(By.CSS_SELECTOR, "p.font-weight-bold.m-0.text-left").text
            except NoSuchElementException:
                team1, team2 = "–", "–"

            odds = {"1": "–", "X": "–", "2": "–"}
            try:
                quota_blocks = row.find_elements(By.CSS_SELECTOR, "div.gridInterernaQuotazioni div.contenitoreSingolaQuota")
                for qb in quota_blocks:
                    label = qb.find_element(By.CSS_SELECTOR, "p.titoloQuotazione").text
                    value = qb.find_element(By.CSS_SELECTOR, "p.tipoQuotazione_1").text
                    odds[label] = value
            except NoSuchElementException:
                pass
                
            # print(f"{formatted_dt} — {team1} vs {team2} | cote: 1={odds['1']}  X={odds['X']}  2={odds['2']}")
            if(formatted_dt == string_data and team1.lower() == team_name1.lower() and team2.lower() == team_name2.lower()):
                print(f"⚽️ Meci găsit: {team1} vs {team2} la {formatted_dt} cu cote: 1={odds['1']}  X={odds['X']}  2={odds['2']}")
                write_match_to_csv("meciuri.csv", formatted_dt, team1, team2, odds)
                return
    finally:
        driver.quit()

if __name__ == "__main__":
    init_csv("meciuri.csv")
    scrape_matches_with_odds("Barcelona", "Real Madrid", "26/04/2025 23:00")
