import requests
import pdfplumber
import re
import json
import os

# URL of the PDF
PDF_URL = "https://almanar.com.lb/legacy/calendars/2025/beirut-2.pdf"
LOCAL_PDF_PATH = "C:\\Users\\user\\Downloads\\Documents\\beirut-2.pdf"

# Directory to store the JSON file
ASSETS_DIR = "assets"

# Step 1: Download the PDF from the URL if not already downloaded
def download_pdf(url, save_path):
    if not os.path.exists(save_path):
        print("Downloading PDF...")
        response = requests.get(url)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
            print("Download complete.")
        else:
            print("Failed to download PDF. Status code:", response.status_code)
            exit(1)
    else:
        print("PDF already downloaded.")

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
    # Download the PDF if necessary
    download_pdf(PDF_URL, LOCAL_PDF_PATH)

    # Extract data from the downloaded PDF
    data = extract_prayer_times(LOCAL_PDF_PATH)
    
    # Ensure the assets directory exists
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)
    
    # Define the JSON file path inside the assets directory
    json_file_path = os.path.join(ASSETS_DIR, "prayer_times.json")
    
    # Save extracted data to a JSON file inside /assets
    with open(json_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Extraction complete. Data saved to {json_file_path}")
