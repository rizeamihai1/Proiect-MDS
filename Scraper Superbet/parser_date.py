import re
from datetime import datetime, date, timedelta

# Set reference date (today)
REF_DATE = None
if REF_DATE is None:
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
    # e.g. "lun. 28, 00:30" or "joi 1, 15:00"
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

def format_parsed(s: str) -> str:
    dt = parse_match_datetime(s)
    return dt.strftime("%d/%m/%Y %H:%M")

# Examples
examples = [
    "astăzi, 15:30",
    "Mâine, 15:15",
    "lun. 28, 00:30",
    "mar. 29, 22:00",
    "mie. 30, 22:00",
    "joi 1, 15:00",
    "vin. 2, 16:00",
    "sâm. 26, 19:00",
    "dum. 27, 18:00",
    "03.05, 16:00"
]

for ex in examples:
    print(f"{ex!r} -> {format_parsed(ex)}")
