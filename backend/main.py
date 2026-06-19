from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from datetime import datetime, timezone
import httpx
import os
import time
from convert_smoke import convert_smoke

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

AIRNOW_API_KEY = os.getenv("AIRNOW_API_KEY")

# Per-forecast-hour cache: {forecast_hour: {"meta": ..., "generated_at": ...}}
_smoke_cache = {}
SMOKE_CACHE_SECONDS = 3600  # regenerate hourly

def get_smoke_meta(forecast_hour=12):
    now = time.time()
    entry = _smoke_cache.get(forecast_hour)
    needs_refresh = (
        entry is None
        or (now - entry["generated_at"]) > SMOKE_CACHE_SECONDS
    )
    if needs_refresh:
        meta = convert_smoke(forecast_hour=forecast_hour)
        _smoke_cache[forecast_hour] = {"meta": meta, "generated_at": now}
    return _smoke_cache[forecast_hour]["meta"]

@app.get("/smoke/bounds")
def get_smoke_bounds(forecast_hour: int = 12):
    meta = get_smoke_meta(forecast_hour=forecast_hour)
    filename = "smoke_overlay_f{:02d}.png".format(meta["forecast_hour"])
    return {
        "image": f"http://localhost:8000/static/{filename}",
        "bounds": meta["bounds"],
        "forecast_hour": meta["forecast_hour"],
        "run_date": meta["run_date"],
        "run_hour": meta["run_hour"],
        "valid_time_epoch": meta["valid_time_epoch"],
    }

def category_and_color(aqi):
    if aqi <= 50: return "Good", "#00E400"
    if aqi <= 100: return "Moderate", "#FFFF00"
    if aqi <= 150: return "Unhealthy for Sensitive Groups", "#FF7E00"
    if aqi <= 200: return "Unhealthy", "#FF0000"
    if aqi <= 300: return "Very Unhealthy", "#8F3F97"
    return "Hazardous", "#7E0023"

US_GRID_POINTS = [
    (47.6, -122.3), (45.5, -122.7), (37.8, -122.4), (34.0, -118.2),
    (32.7, -117.2), (33.4, -112.1), (39.7, -105.0), (35.1, -106.6),
    (29.8, -95.4),  (32.8, -96.8),  (29.4, -98.5),  (41.9, -87.6),
    (44.9, -93.3),  (39.1, -94.6),  (30.3, -81.7),  (33.7, -84.4),
    (25.8, -80.2),  (35.2, -80.8),  (38.9, -77.0),  (40.7, -74.0),
    (42.4, -71.1),  (39.3, -76.6),  (40.4, -79.9),  (41.5, -81.7),
    (43.6, -116.2), (40.8, -111.9), (36.2, -115.1), (39.5, -119.8),
]

@app.get("/aqi/stations")
async def get_stations():
    # Keep only the dominant pollutant (highest AQI) per reporting area
    best_by_area = {}

    async with httpx.AsyncClient(timeout=15) as client:
        for lat, lon in US_GRID_POINTS:
            url = (
                "https://www.airnowapi.org/aq/observation/latLong/current/"
                f"?format=application/json&latitude={lat}&longitude={lon}"
                f"&distance=50&API_KEY={AIRNOW_API_KEY}"
            )
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                obs = resp.json()
            except Exception as e:
                print(f"ERROR for {lat},{lon}: {e}")
                continue

            for o in obs:
                aqi = o.get("AQI")
                if aqi is None or aqi < 0:
                    continue

                area_key = (o.get("ReportingArea"), o.get("StateCode"))
                existing = best_by_area.get(area_key)
                if existing is None or aqi > existing["AQI"]:
                    best_by_area[area_key] = o

    features = []
    for o in best_by_area.values():
        aqi = o.get("AQI")
        category, color = category_and_color(aqi)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [o["Longitude"], o["Latitude"]]
            },
            "properties": {
                "station_name": f"{o.get('ReportingArea','Unknown')}, {o.get('StateCode','')}",
                "aqi": aqi,
                "category": category,
                "color": color,
                "pollutant": o.get("ParameterName", "N/A"),
                "timestamp": f"{o.get('DateObserved','')}" + " " + f"{o.get('HourObserved','')}:00 " + f"{o.get('LocalTimeZone','')}",
            }
        })

    return {"type": "FeatureCollection", "features": features}