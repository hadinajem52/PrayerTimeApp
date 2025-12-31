import requests
import pdfplumber
import re
import json
import os
import datetime
import time

# Get the current year
current_year = datetime.datetime.now().year
current_month = datetime.datetime.now().month 

locations = {
    "beirut": f"https://almanar.com.lb/static/calendars/2026/beirut-1.pdf",
    "tyre": f"https://almanar.com.lb/static/calendars/2026/tyre-1.pdf",
    "saida": f"https://almanar.com.lb/static/calendars/2026/saida-1.pdf",
    "baalbek": f"https://almanar.com.lb/static/calendars/2026/baalbek-1.pdf",
    "hermel": f"https://almanar.com.lb/static/calendars/2026/hermel-1.pdf",
    "tripoli": f"https://almanar.com.lb/static/calendars/2026/tripoli-1.pdf",
    "nabatieh-bintjbeil": f"https://almanar.com.lb/static/calendars/2026/nabatieh-bintjbeil-1.pdf"
}

PDF_FORMATS = {
    "default": {
        "pattern": (
            r"(\d{1,2}:\d{2})\s+"   # midnight
            r"(\d{1,2}:\d{2})\s+"   # isha
            r"(\d{1,2}:\d{2})\s+"   # maghrib
            r"(\d{1,2}:\d{2})\s+"   # asr
            r"(\d{1,2}:\d{2})\s+"   # dhuhr
            r"(\d{1,2}:\d{2})\s+"   # shuruq
            r"(\d{1,2}:\d{2})\s+"   # fajr
            r"(\d{1,2}:\d{2})\s+"   # imsak
            r"(\d{1,2}/\d{1,2}/\d{4})\s+"  # date
            r"([\u0600-\u06FF\s]+)"   # day name
            r"([\u0600-\u06FF0-9\s]+)"  # Hijri date
        ),
        "field_order": ["midnight", "isha", "maghrib", "asr", "dhuhr", "shuruq", "fajr", "imsak", "date", "day_name", "hijri_date"]
    },
    "alternative": {
        "pattern": (
            r"(\d{1,2}/\d{1,2}/\d{4})\s+"  # date first
            r"([\u0600-\u06FF\s]+)\s+"   # day name
            r"(\d{1,2}:\d{2})\s+"   # imsak
            r"(\d{1,2}:\d{2})\s+"   # fajr
            r"(\d{1,2}:\d{2})\s+"   # shuruq
            r"(\d{1,2}:\d{2})\s+"   # dhuhr
            r"(\d{1,2}:\d{2})\s+"   # asr
            r"(\d{1,2}:\d{2})\s+"   # maghrib
            r"(\d{1,2}:\d{2})\s+"   # isha
            r"(\d{1,2}:\d{2})"      # midnight
        ),
        "field_order": ["date", "day_name", "imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"]
    }
}

PDFS_DIR = "pdfs"
ASSETS_DIR = "assets"

os.makedirs(PDFS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

def clean_old_pdfs():
    """Remove PDFs from previous months"""
    if os.path.exists(PDFS_DIR):
        for file in os.listdir(PDFS_DIR):
            if file.endswith('.pdf') and not file.endswith(f"-{current_month}.pdf"):
                os.remove(os.path.join(PDFS_DIR, file))
                print(f"Removed old PDF: {file}")

def download_pdf(url, save_path, retries=5, initial_timeout=300, max_timeout=900):
    """
    Download PDF with extended timeout and exponential backoff
    
    Args:
        url: URL to download from
        save_path: Where to save the PDF
        retries: Maximum number of retry attempts
        initial_timeout: Starting timeout in seconds (300s = 5 minutes)
        max_timeout: Maximum timeout in seconds (900s = 15 minutes)
    """
    attempt = 0
    current_timeout = initial_timeout
    
    while attempt < retries:
        print(f"Attempt {attempt + 1}: Downloading PDF from {url} ...")
        print(f"Using timeout of {current_timeout} seconds")
        
        try:
            response = requests.get(url, timeout=current_timeout)
            if response.status_code == 200:
                with open(save_path, "wb") as f:
                    f.write(response.content)
                print(f"Downloaded and saved to {save_path}.")
                return True
            else:
                print(f"Failed to download PDF. Status code: {response.status_code}")
        except requests.exceptions.Timeout:
            print(f"Request timed out after {current_timeout} seconds")
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            
        attempt += 1
        
        if attempt < retries:
            current_timeout = min(current_timeout * 1.5, max_timeout)
            delay = min(60 * attempt, 300)  
            print(f"Retrying in {delay} seconds with increased timeout of {current_timeout} seconds...")
            time.sleep(delay)
            
    print("Exceeded maximum retries. Exiting.")
    return False

def parse_line(line, debug=False):
    """Parse a line using different format configurations"""
    
    for format_name, format_config in PDF_FORMATS.items():
        pattern = format_config["pattern"]
        field_order = format_config["field_order"]
        
        match = re.search(pattern, line)
        if match:
            if debug:
                print(f"Matched format: {format_name}")
            
            result = {}
            for i, field in enumerate(field_order):
                if i < len(match.groups()):
                    result[field] = match.group(i+1).strip()
            
            for time_field in ["asr", "maghrib", "isha", "midnight"]:
                if time_field in result:
                    result[time_field] = convert_to_24h_format(result[time_field])
            
            if "hijri_date" not in result:
                result["hijri_date"] = "Unknown"
                
            return result
    
    return None

def convert_to_24h_format(time_str):
    """Convert a time string to 24-hour format if needed"""
    hours, minutes = map(int, time_str.split(':'))
    

    if hours < 12 and hours != 0: 
        hours += 12
    
    return f"{hours:02d}:{minutes:02d}"

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
                    data = parse_line(line, debug)
                    
                    if data is None:
                        data = alternative_parse_line(line, debug)
                    
                    if data and validate_prayer_times(data):
                        prayer_times.append(data)
                    elif data:
                        fixed_data = fix_prayer_times(data, debug)
                        if fixed_data:
                            prayer_times.append(fixed_data)
                            if debug:
                                print(f"Fixed invalid data from line: {line[:50]}...")
    
    if len(prayer_times) == 0 and debug:
        print(f"WARNING: No prayer times extracted from {location}!")
        print("This might be due to a different PDF format that doesn't match our regex pattern.")
    
    return prayer_times

def alternative_parse_line(line, debug=False):
    """Alternative parsing method when regex fails"""
    times = re.findall(r'\d{1,2}:\d{2}', line)
    date_pattern = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', line)
    
    if len(times) >= 7 and date_pattern:
        if debug:
            print(f"Using alternative parsing for line: {line[:50]}...")
        
        data = {
            "midnight": "00:00",
            "isha": "00:00",
            "maghrib": "00:00",
            "asr": "00:00",
            "dhuhr": "00:00",
            "shuruq": "00:00",
            "fajr": "00:00",
            "imsak": "00:00",
            "date": date_pattern.group(1),
            "day_name": "Unknown", 
            "hijri_date": "Unknown"
        }
        
        prayer_keys = ["midnight", "isha", "maghrib", "asr", "dhuhr", "shuruq", "fajr", "imsak"]
        for i, key in enumerate(prayer_keys):
            if i < len(times):
                data[key] = convert_to_24h_format(times[i])
        
        day_match = re.search(r'([\u0600-\u06FF\s]+)', line)
        if day_match:
            data["day_name"] = day_match.group(1).strip()
        
        return data
    
    return None

def validate_prayer_times(data):
    """Validate that prayer times follow the expected sequence and format"""
    if not data:
        return False
    
    # Check that all required fields exist
    required_fields = ["fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"]
    for field in required_fields:
        if field not in data or not data[field]:
            return False
    
    # Simple validation that times are in expected sequence
    # Convert times to minutes since midnight for comparison
    try:
        times = {}
        for prayer in required_fields:
            h, m = map(int, data[prayer].split(':'))
            times[prayer] = h * 60 + m
        
        # Check sequence
        return (times["fajr"] < times["shuruq"] < times["dhuhr"] < 
                times["asr"] < times["maghrib"] < times["isha"])
    except:
        return False

def fix_prayer_times(data, debug=False):
    """Attempt to fix invalid prayer times data"""

    prayers = ["fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"]
    
    for i in range(len(prayers) - 1):
        current = prayers[i]
        next_prayer = prayers[i + 1]
        
        if current in data and next_prayer in data:
            current_time = data[current]
            next_time = data[next_prayer]
            
            # Convert to minutes since midnight
            ch, cm = map(int, current_time.split(':'))
            nh, nm = map(int, next_time.split(':'))
            current_mins = ch * 60 + cm
            next_mins = nh * 60 + nm
            
            if next_mins <= current_mins:
                next_mins = current_mins + 1
                new_h = next_mins // 60
                new_m = next_mins % 60
                data[next_prayer] = f"{new_h:02d}:{new_m:02d}"
                
                if debug:
                    print(f"Fixed time sequence: {current}={current_time}, {next_prayer}={data[next_prayer]}")
    
    return data if validate_prayer_times(data) else None

def analyze_pdf_structure(pdf_path, debug=False):
    """Analyze PDF structure to automatically detect field positions"""
    field_positions = {}
    prayer_name_patterns = {
        "fajr": r"(فاجر|الصبح|صلاة الفجر)",
        "shuruq": r"(شروق|طلوع الشمس)",
        "dhuhr": r"(ظهر|الظهر)",
        "asr": r"(عصر|العصر)", 
        "maghrib": r"(مغرب|المغرب)",
        "isha": r"(عشاء|العشاء)",
        "imsak": r"(امساك|إمساك)",
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        # Analyze first page
        if len(pdf.pages) > 0:
            page = pdf.pages[0]
            text = page.extract_text()
            
            # Look for header row that might contain prayer names
            lines = text.split('\n')
            for line in lines[:10]:  # Check first 10 lines for headers
                for prayer, pattern in prayer_name_patterns.items():
                    match = re.search(pattern, line, re.IGNORECASE | re.UNICODE)
                    if match:
                        field_positions[prayer] = match.start()
                        if debug:
                            print(f"Found {prayer} at position {match.start()} in line: {line}")
    
    if debug and field_positions:
        print("Detected field positions:")
        for prayer, pos in sorted(field_positions.items(), key=lambda x: x[1]):
            print(f"  {prayer}: {pos}")
    
    return field_positions

def generate_dynamic_format(field_positions, debug=False):
    """Generate a custom PDF format based on detected field positions"""
    if not field_positions or len(field_positions) < 4:
        if debug:
            print("Not enough field positions detected for dynamic format generation")
        return None
    
    # Sort prayers by their position in the document
    sorted_prayers = sorted(field_positions.items(), key=lambda x: x[1])
    if debug:
        print("Sorted prayer positions for format generation:")
        for prayer, pos in sorted_prayers:
            print(f"  {prayer}: {pos}")
    
    # Generate field order based on positions
    field_order = [prayer for prayer, _ in sorted_prayers]
    
    # Add other required fields that might not be in the headers
    required_fields = ["date", "day_name", "hijri_date", "midnight", "imsak"]
    for field in required_fields:
        if field not in field_order:
            field_order.append(field)
    
    # Generate a more flexible pattern based on detected order
    pattern_parts = []
    for field in field_order:
        if field in ["date"]:
            pattern_parts.append(r"(\d{1,2}/\d{1,2}/\d{4})\s*")
        elif field in ["day_name"]:
            pattern_parts.append(r"([\u0600-\u06FF\s]+)\s*")
        elif field in ["hijri_date"]:
            pattern_parts.append(r"([\u0600-\u06FF0-9\s]+)\s*")
        else:  # Time fields
            pattern_parts.append(r"(\d{1,2}:\d{2})\s*")
    
    pattern = "".join(pattern_parts)
    
    # Create a new format configuration
    dynamic_format = {
        "pattern": pattern,
        "field_order": field_order
    }
    
    if debug:
        print("Generated dynamic format:")
        print(f"  Field order: {field_order}")
        print(f"  Pattern: {pattern}")
    
    return dynamic_format

if __name__ == "__main__":
    all_data = {}
    total_days_extracted = 0
    
    # Add debug flag - set to True to see diagnostic info
    debug_mode = True

    # Call this function before processing locations
    clean_old_pdfs()

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
        
        # Add PDF structure analysis and dynamic format generation
        field_positions = analyze_pdf_structure(local_pdf_path, debug=current_debug)
        if field_positions:
            dynamic_format = generate_dynamic_format(field_positions, debug=current_debug)
            if dynamic_format:
                # Add the dynamic format to the PDF_FORMATS dictionary
                PDF_FORMATS["dynamic"] = dynamic_format
                if current_debug:
                    print(f"Added dynamic format for {location}")
        
        # Extract data from the PDF
        prayer_times = extract_prayer_times(local_pdf_path, location, debug=current_debug)
        all_data[location] = prayer_times
        
        # Log how many days were extracted for this location
        print(f"Extracted {len(prayer_times)} days of prayer times from {location}")
        total_days_extracted += len(prayer_times)

    # Define the JSON file path inside the assets directory
    json_file_path = os.path.join(ASSETS_DIR, "prayer_times.json")
    
    # Save extracted data to a JSON file inside /assets
    # Add timestamp for when data was last updated
    all_data["last_updated"] = datetime.datetime.now().isoformat()
    
    with open(json_file_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nExtraction complete. Total days extracted: {total_days_extracted}")
    print(f"Data saved to {json_file_path}")
