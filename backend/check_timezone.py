import httpx, os
from dotenv import load_dotenv
load_dotenv()
key = os.getenv("AIRNOW_API_KEY")
url = f"https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=37.8&longitude=-122.4&distance=50&API_KEY={key}"
resp = httpx.get(url, timeout=15)
import json
print(json.dumps(resp.json()[:2], indent=2))

