import requests
import pdfplumber
import re
import json
import os
import datetime
import time

# Get the current year
current_year = datetime.datetime.now().year
current_month = datetime.datetime.now().month  # New variable for current month

locations = {
    "beirut": f"https://almanar.com.lb/legacy/calendars/{current_year}/beirut-{current_month}.pdf",
    "tyre": f"https://almanar.com.lb/legacy/calendars/{current_year}/tyre-{current_month}.pdf",
    "saida": f"https://almanar.com.lb/legacy/calendars/{current_year}/saida-{current_month}.pdf",
    "baalbek": f"https://almanar.com.lb/legacy/calendars/{current_year}/baalbek-{current_month}.pdf",
    "hermel": f"https://almanar.com.lb/legacy/calendars/{current_year}/hermel-{current_month}.pdf",
    "tripoli": f"https://almanar.com.lb/legacy/calendars/{current_year}/tripoli-{current_month}.pdf",
    "nabatieh-bintjbeil": f"https://almanar.com.lb/legacy/calendars/{current_year}/nabatieh-bintjbeil-{current_month}.pdf"
}

# Directories for PDFs and JSON assets
PDFS_DIR = "pdfs"
ASSETS_DIR = "assets"

# Ensure directories exist
os.makedirs(PDFS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# Step 1: Download the PDF from the URL
def download_pdf(url, save_path, retries=5, delay=500):
    attempt = 0
    while attempt < retries:
        print(f"Attempt {attempt + 1}: Downloading PDF from {url} ...")
        response = requests.get(url)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
            print(f"Downloaded and saved to {save_path}.")
            return True
        else:
            print(f"Failed to download PDF. Status code: {response.status_code}")
            attempt += 1
            if attempt < retries:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
    print("Exceeded maximum retries. Exiting.")
    return False

# Step 2: Parse each line to extract prayer times using regex
def parse_line(line):
    # Updated pattern to handle both formats
    # First try with the new format (with Hijri date)
    new_pattern = (
        r"(\d{2}:\d{2})\s+"   # midnight
        r"(\d{2}:\d{2})\s+"   # isha (العشاء)
        r"(\d{2}:\d{2})\s+"   # maghrib (المغرب)
        r"(\d{2}:\d{2})\s+"   # asr (العصر)
        r"(\d{2}:\d{2})\s+"   # dhuhr (الظهر)
        r"(\d{1,2}:\d{2})\s+" # shuruq (الشروق)
        r"(\d{1,2}:\d{2})\s+" # fajr (الصبح)
        r"(\d{1,2}:\d{2})\s+" # imsak (الامساك)
        r"(\d{1,2}/\d{1,2}/\d{4})\s+" # date (التاريخ)
        r"([\u0600-\u06FF\s]+)\s+"  # day name in Arabic (اليوم)
        r"([\u0600-\u06FF0-9\s]+)"  # Hijri date
    )
    
    # Alternative pattern for the old format
    old_pattern = (
        r"(\d{2}:\d{2})\s+"   # midnight
        r"(\d{2}:\d{2})\s+"   # isha (العشاء)
        r"(\d{2}:\d{2})\s+"   # maghrib (المغرب)
        r"(\d{2}:\d{2})\s+"   # asr (العصر)
        r"(\d{2}:\d{2})\s+"   # dhuhr (الظهر)
        r"(\d{1,2}:\d{2})\s+" # shuruq (الشروق)
        r"(\d{1,2}:\d{2})\s+" # fajr (الصبح)
        r"(\d{1,2}:\d{2})\s+" # imsak (الامساك)
        r"(\d{1,2}/\d{1,2}/\d{4})\s+" # date (التاريخ)
        r"([\u0600-\u06FF\s]+)\s+"      # day name in Arabic (اليوم)
        r"(\d+)"                       # day number
    )
    
    # Another pattern for when the day number comes at the beginning (as in beirut-2.pdf)
    start_with_number_pattern = (
        r"^(\d+)"               # day number at start
        r"([\u0600-\u06FF\s]+)" # day name in Arabic
        r"(\d{1,2}/\d{1,2}/\d{4})\s+" # date
        r"(\d{1,2}:\d{2})\s+"   # imsak
        r"(\d{1,2}:\d{2})\s+"   # fajr
        r"(\d{1,2}:\d{2})\s+"   # shuruq
        r"(\d{2}:\d{2})\s+"     # dhuhr
        r"(\d{2}:\d{2})\s+"     # asr
        r"(\d{2}:\d{2})\s+"     # maghrib
        r"(\d{2}:\d{2})\s+"     # isha
        r"(\d{2}:\d{2})"        # midnight
    )
    
    # Try the new format first
    match = re.search(new_pattern, line)
    if match:
        return {
            "midnight": match.group(1),
            "isha": match.group(2),
            "maghrib": match.group(3),
            "asr": match.group(4),
            "dhuhr": match.group(5),
            "shuruq": match.group(6),
            "fajr": match.group(7),
            "imsak": match.group(8),
            "date": match.group(9),
            "day_name": match.group(10).strip(),
            "hijri_date": match.group(11).strip()
        }
    
    # Try the old format
    match = re.search(old_pattern, line)
    if match:
        return {
            "midnight": match.group(1),
            "isha": match.group(2),
            "maghrib": match.group(3),
            "asr": match.group(4),
            "dhuhr": match.group(5),
            "shuruq": match.group(6),
            "fajr": match.group(7),
            "imsak": match.group(8),
            "date": match.group(9),
            "day_name": match.group(10).strip(),
            "day_number": match.group(11),
            "hijri_date": ""  # Empty for old format
        }
    
    # Try the format where day number is at the beginning
    match = re.search(start_with_number_pattern, line)
    if match:
        return {
            "day_number": match.group(1),
            "day_name": match.group(2).strip(),
            "date": match.group(3),
            "imsak": match.group(4),
            "fajr": match.group(5),
            "shuruq": match.group(6),
            "dhuhr": match.group(7),
            "asr": match.group(8),
            "maghrib": match.group(9),
            "isha": match.group(10),
            "midnight": match.group(11),
            "hijri_date": ""  # Empty for old format
        }
    
    return None

# Step 3: Extract prayer times data from the PDF
def extract_prayer_times(pdf_path):
    prayer_times = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                lines = text.split("\n")
                for line in lines:
                    data = parse_line(line)
                    if data:
                        prayer_times.append(data)
    return prayer_times

if __name__ == "__main__":
    all_data = {}

    for location, url in locations.items():
        print(f"\nProcessing location: {location}")
        # Define the local PDF path for the location
        local_pdf_path = os.path.join(PDFS_DIR, f"{location}-{current_month}.pdf")
        
        # Check if the PDF already exists
        if os.path.exists(local_pdf_path):
            print(f"PDF for {location} already exists at {local_pdf_path}. Skipping download.")
        else:
            # Download the PDF only if it doesn't exist
            if not download_pdf(url, local_pdf_path):
                print(f"Failed to download PDF for {location}. Skipping...")
                continue
        
        # Extract data from the PDF
        prayer_times = extract_prayer_times(local_pdf_path)
        all_data[location] = prayer_times

    # Define the JSON file path inside the assets directory
    json_file_path = os.path.join(ASSETS_DIR, "prayer_times.json")
    
    # Save extracted data to a JSON file inside /assets
    with open(json_file_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nExtraction complete. Data saved to {json_file_path}")