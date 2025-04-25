from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time

def scrape_matches_with_odds(team_name,
                             timeout=10,
                             char_delay=0.15,
                             pre_type_delay=0.5,
                             post_type_delay=1.0):
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, timeout)

    try:
        driver.get("https://spin.ro/sport")

        # accept cookies
        try:
            dlg = wait.until(EC.visibility_of_element_located(
                (By.CSS_SELECTOR, "div.osano-cm-dialog--type_bar")
            ))
            dlg.find_element(By.CSS_SELECTOR, "button.osano-cm-accept-all").click()
            wait.until(EC.invisibility_of_element(dlg))
        except TimeoutException:
            pass

        # focus + typing
        inp = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "div.widget-ricerca-side input#match-search-input")
        ))
        inp.click()
        time.sleep(pre_type_delay)
        driver.execute_script("arguments[0].value = '';", inp)
        for ch in team_name:
            inp.send_keys(ch)
            time.sleep(char_delay)
        inp.send_keys(Keys.ENTER)
        time.sleep(post_type_delay)

        # wait rows
        try:
            wait.until(EC.presence_of_element_located(
                (By.CSS_SELECTOR, "div.contenitoreRiga")
            ))
        except TimeoutException:
            print("Niciun meci găsit pentru:", team_name)
            return

        rows = driver.find_elements(By.CSS_SELECTOR, "div.contenitoreRiga")
        for row in rows:
            # date/time
            try:
                tempo = row.find_element(By.CSS_SELECTOR, "div.tabellaQuoteTempo")
                date = tempo.find_element(By.CSS_SELECTOR, "span.tabellaQuoteTempo__data").text
                hour = tempo.find_element(By.CSS_SELECTOR, "span.tabellaQuoteTempo__ora").text
            except NoSuchElementException:
                date, hour = "–", "–"

            # teams
            try:
                team1 = row.find_element(By.CSS_SELECTOR, "p.font-weight-bold.m-0.text-right").text
                team2 = row.find_element(By.CSS_SELECTOR, "p.font-weight-bold.m-0.text-left").text
            except NoSuchElementException:
                team1, team2 = "–", "–"

            # odds (corectăm selectorul pentru titlu)
            odds = {"1": "–", "X": "–", "2": "–"}
            try:
                quota_blocks = row.find_elements(
                    By.CSS_SELECTOR,
                    "div.gridInterernaQuotazioni div.contenitoreSingolaQuota"
                )
                for qb in quota_blocks:
                    label = qb.find_element(By.CSS_SELECTOR, "p.titoloQuotazione").text
                    value = qb.find_element(By.CSS_SELECTOR, "p.tipoQuotazione_1").text
                    odds[label] = value
            except NoSuchElementException:
                pass

            print(f"{date} {hour} — {team1} vs {team2} | cote: 1={odds['1']}  X={odds['X']}  2={odds['2']}")

    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_matches_with_odds("Barcelona")
