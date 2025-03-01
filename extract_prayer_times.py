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
    # Updated pattern to handle single-digit hour for Asr time
    new_pattern = (
        r"(\d{2}:\d{2})\s+"   # midnight
        r"(\d{2}:\d{2})\s+"   # isha (العشاء)
        r"(\d{2}:\d{2})\s+"   # maghrib (المغرب)
        r"(\d{1,2}:\d{2})\s+" # asr (العصر) - Modified to accept 1 or 2 digits
        r"(\d{2}:\d{2})\s+"   # dhuhr (الظهر)
        r"(\d{1,2}:\d{2})\s+" # shuruq (الشروق)
        r"(\d{1,2}:\d{2})\s+" # fajr (الصبح)
        r"(\d{1,2}:\d{2})\s+" # imsak (الامساك)
        r"(\d{1,2}/\d{1,2}/\d{4})\s+" # date (التاريخ)
        r"([\u0600-\u06FF\s]+)\s+"  # day name in Arabic (اليوم)
        r"([\u0600-\u06FF0-9\s]+)"  # Hijri date
    )
    
    match = re.search(new_pattern, line)
    if match:
        # Extract times from regex match
        midnight = match.group(1)
        isha = match.group(2)
        maghrib = match.group(3)
        asr = match.group(4)
        dhuhr = match.group(5)
        shuruq = match.group(6)
        fajr = match.group(7)
        imsak = match.group(8)
        
        # Convert afternoon/evening prayers to 24-hour format if needed
        # Asr prayer time conversion (likely culprit in Saida data)
        asr = convert_to_24h_format(asr)
        
        # Although these seem to be already in 24h format in our data,
        # we'll handle them just to be safe
        dhuhr = convert_to_24h_format(dhuhr)
        maghrib = convert_to_24h_format(maghrib)
        isha = convert_to_24h_format(isha)
        midnight = convert_to_24h_format(midnight)
        
        # Morning prayers (already in correct format, no need to convert)
        # imsak, fajr, and shuruq remain as is
        
        return {
            "midnight": midnight,
            "isha": isha,
            "maghrib": maghrib,
            "asr": asr,
            "dhuhr": dhuhr,
            "shuruq": shuruq,
            "fajr": fajr,
            "imsak": imsak,
            "date": match.group(9),
            "day_name": match.group(10).strip(),
            "hijri_date": match.group(11).strip()
        }
    
    return None

# Helper function to convert time to 24-hour format
def convert_to_24h_format(time_str):
    """Convert a time string to 24-hour format if needed"""
    hours, minutes = map(int, time_str.split(':'))
    
    # If hour is less than 12 and it's an afternoon/evening prayer time, 
    # add 12 hours to convert to 24-hour format
    if hours < 12 and hours != 0:  # Don't convert midnight (00:00)
        # For times like 3:07 PM, convert to 15:07
        hours += 12
    
    # Format back to string "HH:MM"
    return f"{hours:02d}:{minutes:02d}"

# Step 3: Extract prayer times data from the PDF with added diagnostics
def extract_prayer_times(pdf_path, location=None, debug=False):
    prayer_times = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                lines = text.split("\n")
                if debug:
                    print(f"\n===== DEBUG: First 10 lines from {location} PDF (page {page_num+1}) =====")
                    for i, line in enumerate(lines[:10]):
                        print(f"Line {i+1}: {line}")
                    print("=====")
                
                for line in lines:
                    data = parse_line(line)
                    if data:
                        prayer_times.append(data)
    
    if len(prayer_times) == 0 and debug:
        print(f"WARNING: No prayer times extracted from {location}!")
        print("This might be due to a different PDF format that doesn't match our regex pattern.")
    
    return prayer_times

if __name__ == "__main__":
    all_data = {}
    total_days_extracted = 0
    
    # Add debug flag - set to True to see diagnostic info
    debug_mode = True

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
        
        # Special debugging for Saida location
        current_debug = debug_mode or location == "saida"
        
        # Extract data from the PDF
        prayer_times = extract_prayer_times(local_pdf_path, location, debug=current_debug)
        all_data[location] = prayer_times
        
        # Log how many days were extracted for this location
        print(f"Extracted {len(prayer_times)} days of prayer times from {location}")
        total_days_extracted += len(prayer_times)

    # Define the JSON file path inside the assets directory
    json_file_path = os.path.join(ASSETS_DIR, "prayer_times.json")
    
    # Save extracted data to a JSON file inside /assets
    with open(json_file_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nExtraction complete. Total days extracted: {total_days_extracted}")
    print(f"Data saved to {json_file_path}")