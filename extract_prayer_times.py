import requests
import pdfplumber
import re
import json
import os

locations = {
    "beirut": "https://almanar.com.lb/legacy/calendars/2025/beirut-2.pdf",
    "tyre": "https://almanar.com.lb/legacy/calendars/2025/tyre-2.pdf",
    "saida": "https://almanar.com.lb/legacy/calendars/2025/saida-2.pdf",
    "baalbek": "https://almanar.com.lb/legacy/calendars/2025/baalbek-2.pdf",
    "hermel": "https://almanar.com.lb/legacy/calendars/2025/hermel-2.pdf",
    "tripoli": "https://almanar.com.lb/legacy/calendars/2025/tripoli-2.pdf",
    "nabatieh-bintjbeil": "https://almanar.com.lb/legacy/calendars/2025/nabatieh-bintjbeil-2.pdf"
}

# Directories for PDFs and JSON assets
PDFS_DIR = "pdfs"
ASSETS_DIR = "assets"

# Ensure directories exist
os.makedirs(PDFS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# Step 1: Download the PDF from the URL if not already downloaded
def download_pdf(url, save_path):
    if not os.path.exists(save_path):
        print(f"Downloading PDF from {url} ...")
        response = requests.get(url)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
            print(f"Downloaded and saved to {save_path}.")
        else:
            print("Failed to download PDF. Status code:", response.status_code)
            exit(1)
    else:
        print(f"PDF already exists at {save_path}.")

# Step 2: Parse each line to extract prayer times using regex
def parse_line(line):
    # This regular expression is designed based on the sample content.
    # It captures the following in order:
    # midnight, isha, maghrib, asr, dhuhr, shuruq, fajr, imsak, date, day name, day number
    pattern = (
        r"(\d{2}:\d{2})\s+"   # midnight
        r"(\d{2}:\d{2})\s+"   # isha (العشاء)
        r"(\d{2}:\d{2})\s+"   # maghrib (المغرب)
        r"(\d{2}:\d{2})\s+"   # asr (العصر)
        r"(\d{2}:\d{2})\s+"   # dhuhr (الظهر)
        r"(\d{1,2}:\d{2})\s+" # shuruq (الشروق) – sometimes hour might be one digit
        r"(\d{1,2}:\d{2})\s+" # fajr (الصبح)
        r"(\d{1,2}:\d{2})\s+" # imsak (الامساك)
        r"(\d{1,2}/\d{1,2}/\d{4})\s+" # date (التاريخ)
        r"([\u0600-\u06FF\s]+)\s+"      # day name in Arabic (اليوم)
        r"(\d+)"                       # day number
    )
    match = re.search(pattern, line)
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
            "day_number": match.group(11)
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
        local_pdf_path = os.path.join(PDFS_DIR, f"{location}-2.pdf")
        
        # Download the PDF if necessary
        download_pdf(url, local_pdf_path)
        
        # Extract data from the downloaded PDF
        prayer_times = extract_prayer_times(local_pdf_path)
        all_data[location] = prayer_times

    # Define the JSON file path inside the assets directory
    json_file_path = os.path.join(ASSETS_DIR, "prayer_times.json")
    
    # Save extracted data to a JSON file inside /assets
    with open(json_file_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nExtraction complete. Data saved to {json_file_path}")
