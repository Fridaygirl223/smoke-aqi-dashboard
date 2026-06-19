import httpx

# List bucket contents with a prefix to see actual file naming
for date_str in ["20260614", "20260613", "20260612"]:
    url = f"https://noaa-rap-pds.s3.amazonaws.com/?list-type=2&prefix=rap.{date_str}/&max-keys=20"
    print(f"=== {date_str} ===")
    try:
        resp = httpx.get(url, timeout=15)
        print(resp.text[:2000])
    except Exception as e:
        print(f"ERROR: {e}")
    print()

