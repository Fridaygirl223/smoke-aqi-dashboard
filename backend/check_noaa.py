import httpx
from datetime import datetime, timedelta, timezone

# Try today and yesterday (NOAA may not have published today yet)
now = datetime.now(timezone.utc)

for days_back in [0, 1]:
    date = now - timedelta(days=days_back)
    date_str = date.strftime("%Y%m%d")
    print(f"=== Checking {date_str} ===")
    for hour in [0, 6, 12, 18]:
        url = f"https://noaa-rap-pds.s3.amazonaws.com/rap.{date_str}/rap_smokeCS.t{hour:02d}z.sfc.1hr_227.grib2"
        try:
            resp = httpx.head(url, timeout=10)
            print(f"  t{hour:02d}z: status={resp.status_code}")
        except Exception as e:
            print(f"  t{hour:02d}z: ERROR {e}")

