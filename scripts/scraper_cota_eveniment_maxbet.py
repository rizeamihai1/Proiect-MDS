import csv
import time
import os
import re
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Fix pentru encoding pe Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def init_csv(filename):
    """
    Creează fișierul CSV cu antetul dacă nu există deja.
    """
    try:
        with open(filename, 'x', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Data", "team1", "team2", "odd_1", "odd_X", "odd_2", "updated_at"])
    except FileExistsError:
        pass  # fișierul există deja

def write_match_to_csv(filename, date, team1, team2, odds):
    """
    Adaugă un rând în CSV cu datele meciului găsit.
    """
    from datetime import datetime
    
    with open(filename, 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        writer.writerow([date, team1, team2, odds['1'], odds['X'], odds['2'], updated_at])

def scrape_odds(string_data: str, team_name1: str, team_name2: str, char_delay: float = 0.1):
    """
    Accesează MaxBet, folosește câmpul de căutare pentru a găsi meciuri și
    extrage cotele pentru meciul specificat.
    """
    # inițializează CSV-ul de output
    output_file = 'odds_maxbet.csv'
    init_csv(output_file)

    url = "https://www.maxbet.ro/ro/pariuri-sportive"
    options = webdriver.ChromeOptions()
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('window-size=1920,1080')
    options.add_experimental_option("prefs", {"profile.default_content_setting_values.notifications": 2})

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    try:
        print(f"Deschid pagina: {url}")
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

        # Acceptă cookies
        try:
            cook_btn = driver.find_element(
                By.XPATH,
                "//button[contains(translate(., 'ĂÂÎȘȚ','ÂÎȘȚĂ'), 'Acceptă cookies')]"
            )
            cook_btn.click()
            time.sleep(0.5)
        except:
            pass

        # Găsește câmpul de căutare
        print("Caut campul de cautare...")
        search_input = wait.until(EC.presence_of_element_located((
            By.CSS_SELECTOR, 
            "input[type='text'][placeholder='Căutare']"
        )))
        
        # Click pe câmpul de căutare și șterge conținutul
        search_input.click()
        search_input.clear()
        time.sleep(0.5)
        
        # Tastează numele primei echipe caracter cu caracter
        print(f"Tastez: {team_name1}")
        for char in team_name1:
            search_input.send_keys(char)
            time.sleep(char_delay)
        
        # Așteaptă încărcarea rezultatelor
        time.sleep(2)
        
        # Găsește div-ul tbody care conține evenimentele
        try:
            tbody_div = wait.until(EC.presence_of_element_located((
                By.CSS_SELECTOR, "div.tbody"
            )))
            print("Am găsit containerul cu evenimente")
        except TimeoutException:
            print("Nu am găsit containerul tbody")
            return

        # Găsește toate evenimentele
        events = tbody_div.find_elements(By.TAG_NAME, "event")
        print(f"Am găsit {len(events)} evenimente")

        # Parcurge fiecare eveniment
        for idx, event in enumerate(events, start=1):
            try:
                # Extrage data și ora
                try:
                    time_div = event.find_element(By.CSS_SELECTOR, "div.time")
                    time_spans = time_div.find_elements(By.TAG_NAME, "span")
                    if len(time_spans) >= 3:
                        date_part = time_spans[0].text.strip()
                        time_part = time_spans[2].text.strip()
                        formatted_dt = date_part
                    else:
                        formatted_dt = time_div.text.strip().replace('\n', ' ')
                except:
                    formatted_dt = ''

                # Găsește numele echipelor
                team_spans = event.find_elements(By.CSS_SELECTOR, "div.general__competitors span[title]")
                if len(team_spans) >= 2:
                    team1 = team_spans[0].text.strip()
                    team2 = team_spans[1].text.strip()
                    
                    # transform the romanian characters to their english equivalents
                    team1_normalized = re.sub(r'[ĂÂÎȘȚăâîșț]', lambda x: {'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T', 
                                                        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't'}[x.group(0)], team1)
                    team2_normalized = re.sub(r'[ĂÂÎȘȚăâîșț]', lambda x: {'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
                                                        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't'}[x.group(0)], team2)
                    
                    # Normalize input team names too
                    team_name1_normalized = re.sub(r'[ĂÂÎȘȚăâîșț]', lambda x: {'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T', 
                                                        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't'}[x.group(0)], team_name1)
                    team_name2_normalized = re.sub(r'[ĂÂÎȘȚăâîșț]', lambda x: {'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
                                                        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't'}[x.group(0)], team_name2)
                    
                    print(f"Echipele: {team1} vs {team2} (normalized: {team1_normalized} vs {team2_normalized})")
                else:
                    continue

                # Verifică dacă este meciul căutat
                if (formatted_dt == string_data and 
                    team1_normalized.lower() == team_name1_normalized.lower() and 
                    team2_normalized.lower() == team_name2_normalized.lower()):
                    
                    print(f"Am gasit meciul: {team1} vs {team2}")
                    
                    # Extrage cotele din market wrapper
                    try:
                        market_wrapper = event.find_element(By.CSS_SELECTOR, "div.market__wrapper")
                        outcome_spans = market_wrapper.find_elements(By.CSS_SELECTOR, 
                            "div.market__outcome span.outcome.centered")
                        
                        if len(outcome_spans) >= 3:
                            odds = {
                                '1': outcome_spans[0].text.strip(),
                                'X': outcome_spans[1].text.strip(),
                                '2': outcome_spans[2].text.strip()
                            }
                        else:
                            odds = {'1': '', 'X': '', '2': ''}
                            
                        print(f"Cote gasite: 1={odds['1']}, X={odds['X']}, 2={odds['2']}")
                        write_match_to_csv(output_file, formatted_dt, team1_normalized, team2_normalized, odds)
                        return
                        
                    except NoSuchElementException:
                        print(f"Nu am putut extrage cotele pentru meciul gasit")
                        
            except Exception as e:
                print(f"Eroare la procesarea evenimentului {idx}: {e}")
                continue

        print("Meciul specificat nu a fost gasit in rezultatele cautarii.")

    except Exception as e:
        print(f"Eroare generala: {e}")
        
    finally:
        driver.quit()

if __name__ == '__main__':
    # Check for command line arguments
    if len(sys.argv) == 4:
        string_data = sys.argv[1]    # data meciului
        team_name1 = sys.argv[2]     # nume echipa 1
        team_name2 = sys.argv[3]     # nume echipa 2
        scrape_odds(string_data, team_name1, team_name2)
    else:
        # Exemplu de utilizare
        string_data = '07/06'      # data meciului în formatul afișat pe site
        team_name1 = 'Malta'       # nume echipa 1
        team_name2 = 'Lituania'    # nume echipa 2
        scrape_odds(string_data, team_name1, team_name2)