import re
from datetime import datetime, date, timedelta
import csv
import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Set reference date (today)
REF_DATE = date.today()

# Map Romanian weekday abbreviations (without trailing dot) to integers Mon=0 … Sun=6
WEEKDAY_MAP = {
    'lun': 0, 'mar': 1, 'mie': 2, 'joi': 3,
    'vin': 4, 'sâm': 5, 'sam': 5, 'dum': 6
}

def parse_match_datetime(s: str, ref_date: date = REF_DATE) -> datetime:
    s = s.strip()
    low = s.lower()

    # Case "astăzi, HH:MM"
    m = re.match(r'^(?:astăzi|azi)\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        hh, mm = map(int, m.groups())
        return datetime(ref_date.year, ref_date.month, ref_date.day, hh, mm)

    # Case "mâine, HH:MM"
    m = re.match(r'^mâine\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        hh, mm = map(int, m.groups())
        tomorrow = ref_date + timedelta(days=1)
        return datetime(tomorrow.year, tomorrow.month, tomorrow.day, hh, mm)

    # Case "DD.MM, HH:MM"
    m = re.match(r'^(\d{1,2})\.(\d{1,2})\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        d, mo, hh, mm = map(int, m.groups())
        return datetime(ref_date.year, mo, d, hh, mm)

    # Case "WEEKDAY DD, HH:MM"
    m = re.match(r'^([^\d,\.]+)\.?\s*(\d{1,2})\s*,\s*(\d{1,2}):(\d{2})$', low)
    if m:
        wd_abbr, day_str, hh_str, mm_str = m.groups()
        day = int(day_str)
        hh = int(hh_str)
        mm = int(mm_str)
        # Determine month: same month if day >= today.day, else next month
        mo = ref_date.month
        yr = ref_date.year
        if day < ref_date.day:
            if mo == 12:
                mo = 1
                yr += 1
            else:
                mo += 1
        return datetime(yr, mo, day, hh, mm)

    raise ValueError(f"Unrecognized date format: '{s}'")

def format_parsed_date(s: str) -> str:
    dt = parse_match_datetime(s)
    return dt.strftime("%d/%m/%Y %H:%M")

def scroll_to_bottom_and_extract(driver, writer, seen,
                                 scroll_pixels=300, scroll_pause=1.0, max_matches=100):
    """
    Scrolls down the window to bottom, extracts newly visible matches,
    formats their dates, and writes them to CSV.
    Stops when bottom reached.
    """
    total_written = 0

    while True:
        rows = driver.find_elements(By.CSS_SELECTOR, '.event-row-container')
        for row in rows:
            try:
                if total_written >= max_matches:
                    return total_written
                    
                main = row.find_element(By.CSS_SELECTOR, '.event-card__main-content')
                # Extract raw date text
                try:
                    raw_date = main.find_element(
                        By.CSS_SELECTOR, '.event-card-label .capitalize'
                    ).text.strip()
                except:
                    raw_date = main.find_element(
                        By.CSS_SELECTOR, '.event-card-label'
                    ).text.strip()

                # Format date
                formatted_date = format_parsed_date(raw_date)

                # Extract teams
                team1 = main.find_element(
                    By.CSS_SELECTOR, '.event-competitor__name.e2e-event-team1-name'
                ).text.strip()
                team2 = main.find_element(
                    By.CSS_SELECTOR, '.event-competitor__name.e2e-event-team2-name'
                ).text.strip()

                key = (formatted_date, team1, team2)
                if key not in seen:
                    seen.add(key)
                    writer.writerow({
                        'date': formatted_date,
                        'team1': team1,
                        'team2': team2
                    })
                    print(f"Added: \"{formatted_date}\",{team1},{team2}")
                    total_written += 1
            except:
                continue

        # Scroll down
        driver.execute_script(f"window.scrollBy(0, {scroll_pixels});")
        time.sleep(scroll_pause)

        # Check if at bottom
        at_bottom = driver.execute_script(
            "return window.innerHeight + window.pageYOffset >= document.body.scrollHeight;"
        )
        if at_bottom:
            time.sleep(1)
            break

    return total_written

def main():
    # Setup Chrome
    opts = webdriver.ChromeOptions()
    #opts.add_argument('--headless')
    opts.add_argument('--disable-gpu')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    opts.add_argument('window-size=1920,1080')

    driver = webdriver.Chrome(options=opts)
    wait = WebDriverWait(driver, 0)

    url = 'https://superbet.ro/pariuri-sportive/fotbal/toate'
    driver.get(url)

    # Accept cookies
    try:
        cookie_btn = wait.until(EC.element_to_be_clickable((By.ID, 'onetrust-accept-btn-handler')))
        cookie_btn.click()
        print("[OK] Cookies accepted")

        time.sleep(0.1)
    except:
        print("[INFO] No cookie prompt")

    # Small scroll to trigger modal
    driver.execute_script("window.scrollBy(0, 100);")
    time.sleep(0.1)

    # Close modal if present
    try:
        close_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'button.e2e-close-modal')))
        close_btn.click()
        print("Modal closed")
        time.sleep(0.1)
    except:
        print("No modal to close")

    # Prepare CSV
    csv_path = os.path.join(os.getcwd(), 'all_football_matches.csv')
    first = not os.path.exists(csv_path)
    seen = set()
    with open(csv_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['date', 'team1', 'team2'])
        if first:
            writer.writeheader()

        # Scroll and extract matches
        written = scroll_to_bottom_and_extract(driver, writer, seen, scroll_pixels=6000, scroll_pause=0.005, max_matches=100)
        print(f"Scraping complete. {written} new matches added.")

    driver.quit()

if __name__ == '__main__':
    main()
