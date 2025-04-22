# Prerequisites: Install Selenium and WebDriver Manager before running:
# pip install selenium webdriver-manager

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import csv
import time
from datetime import datetime

# Setup Chrome WebDriver (visible browser, not headless)
chrome_options = Options()
# (No headless mode, so the browser window will be visible by default)
# Initialize the Chrome driver using webdriver-manager (auto installs ChromeDriver)
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

# Open the target URL (football betting odds page)
url = "https://superbet.ro/pariuri-sportive/fotbal/toate"
driver.get(url)

# Accept cookies if the consent button appears (to ensure content is accessible)
try:
    # The cookie consent button (OneTrust) commonly has id "onetrust-accept-btn-handler"
    consent_btn = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
    )
    consent_btn.click()
except Exception:
    # If no consent prompt or any issue, proceed without interruption
    pass

# Continuously scrape every 60 seconds
try:
    while True:
        # Wait until the prematch offer section and event cards are loaded
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".offer--prematch .event-card.e2e-event-row.event-row-container__event"))
        )
        # Find the first 30 event cards in the prematch offers section
        event_cards = driver.find_elements(By.CSS_SELECTOR, ".offer--prematch .event-card.e2e-event-row.event-row-container__event")
        event_cards = event_cards[:30]  # limit to first 30 events if more are present

        # Prepare data for CSV
        data_rows = []
        # Get current timestamp for this batch
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for card in event_cards:
            # Extract Team 1 and Team 2 names
            try:
                team1 = card.find_element(By.CSS_SELECTOR, ".event-competitor__name.e2e-event-team1-name").text
            except NoSuchElementException:
                team1 = "N/A"
            try:
                team2 = card.find_element(By.CSS_SELECTOR, ".event-competitor__name.e2e-event-team2-name").text
            except NoSuchElementException:
                team2 = "N/A"

            # Extract odds for outcomes "1", "X", "2"
            try:
                # Find the odd value following the span that contains text "1"
                odd1_element = card.find_element(
                    By.XPATH, ".//span[normalize-space(text())='1']/following-sibling::span//span[contains(@class, 'e2e-odd-current-value')]"
                )
                odd1 = odd1_element.text
            except NoSuchElementException:
                odd1 = "N/A"
            try:
                oddX_element = card.find_element(
                    By.XPATH, ".//span[normalize-space(text())='X']/following-sibling::span//span[contains(@class, 'e2e-odd-current-value')]"
                )
                oddX = oddX_element.text
            except NoSuchElementException:
                oddX = "N/A"
            try:
                odd2_element = card.find_element(
                    By.XPATH, ".//span[normalize-space(text())='2']/following-sibling::span//span[contains(@class, 'e2e-odd-current-value')]"
                )
                odd2 = odd2_element.text
            except NoSuchElementException:
                odd2 = "N/A"

            # Append the collected data (with timestamp)
            data_rows.append([timestamp, team1, team2, odd1, oddX, odd2])

        # Write the results to CSV (overwrite each time)
        with open("football_odds.csv", mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            # Write header
            writer.writerow(["Timestamp", "Team 1", "Team 2", "Odd 1", "Odd X", "Odd 2"])
            # Write all event rows
            writer.writerows(data_rows)

        # (Optional) Print a status message for logging
        print(f"{len(data_rows)} events scraped at {timestamp}, data saved to football_odds.csv")

        # Wait 60 seconds before refreshing for the next update
        time.sleep(60)
        driver.refresh()
except KeyboardInterrupt:
    # Handle Ctrl+C interruption to exit gracefully
    print("Scraping interrupted by user. Exiting...")
finally:
    # Close the browser window on exit
    driver.quit()
