import httpx

date_str = "20260614"
hour_run = "00"

for f in range(0, 22):
    url = f"https://noaa-rap-pds.s3.amazonaws.com/rap.{date_str}/rap.t{hour_run}z.awip32f{f:02d}.grib2"
    try:
        resp = httpx.head(url, timeout=10)
        print(f"f{f:02d}: status={resp.status_code}")
    except Exception as e:
        print(f"f{f:02d}: ERROR {e}")

