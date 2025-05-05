import os
import sys
import subprocess
import platform

def ensure_dependencies():
    """
    Ensure all required Python dependencies are installed
    """
    try:
        import selenium
        from selenium import webdriver
        print("Selenium is already installed")
    except ImportError:
        print("Installing Selenium...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "selenium"])
        print("Selenium installed successfully")
    
    try:
        # Check if Chrome WebDriver is available
        from selenium import webdriver
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        driver = webdriver.Chrome(options=options)
        driver.quit()
        print("Chrome WebDriver is working")
    except Exception as e:
        print(f"Chrome WebDriver issue: {e}")
        print("Please ensure Chrome and ChromeDriver are installed and compatible")
        
    # Additional dependencies
    try:
        import csv
        import re
        from datetime import datetime
        print("Standard libraries available")
    except ImportError as e:
        print(f"Missing standard library: {e}")

def get_script_dir():
    """
    Get the directory where the scripts are located
    """
    return os.path.dirname(os.path.abspath(__file__))

def clean_output_files():
    """
    Clean up any output CSV files from previous runs
    """
    script_dir = get_script_dir()
    for file in ['odds.csv', 'all_football_matches.csv', 'maxbet_meciuri.csv', 'meciuri.csv']:
        file_path = os.path.join(script_dir, file)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Removed old output file: {file}")
            except Exception as e:
                print(f"Could not remove {file}: {e}")

if __name__ == "__main__":
    ensure_dependencies()
