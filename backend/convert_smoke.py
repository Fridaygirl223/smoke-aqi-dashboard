import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.windows import from_bounds
import numpy as np
from PIL import Image
from datetime import datetime, timezone
import httpx

OUT_PNG_TEMPLATE = "static/smoke_overlay_f{:02d}.png"
SMOKE_BAND = 499

# CONUS-ish bounds in lon/lat
CONUS_BOUNDS = {"west": -130, "south": 20, "east": -60, "north": 55}

def find_latest_run():
    now = datetime.now(timezone.utc)
    for days_back in [0, 1]:
        date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        date = date.fromtimestamp(date.timestamp() - days_back * 86400, tz=timezone.utc)
        date_str = date.strftime("%Y%m%d")
        for run_hour in [18, 12, 6, 0]:
            url = f"https://noaa-rap-pds.s3.amazonaws.com/rap.{date_str}/rap.t{run_hour:02d}z.awip32f00.grib2"
            try:
                resp = httpx.head(url, timeout=10)
                if resp.status_code == 200:
                    return date_str, run_hour
            except Exception:
                continue
    raise RuntimeError("No NOAA RAP data found for today or yesterday")

def convert_smoke(forecast_hour=12):
    date_str, run_hour = find_latest_run()
    url = f"/vsicurl/https://noaa-rap-pds.s3.amazonaws.com/rap.{date_str}/rap.t{run_hour:02d}z.awip32f{forecast_hour:02d}.grib2"
    print(f"Using: rap.{date_str} t{run_hour:02d}z f{forecast_hour:02d}")

    with rasterio.open(url) as src:
        dst_crs = "EPSG:4326"

        # Reproject the FULL grid to lat/lon at a reasonable upsampled resolution
        out_width, out_height = 1440, 720  # upsample for smoother appearance
        transform, width, height = calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds,
            dst_width=out_width, dst_height=out_height
        )

        data = np.empty((height, width), dtype=np.float32)
        reproject(
            source=rasterio.band(src, SMOKE_BAND),
            destination=data,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=transform,
            dst_crs=dst_crs,
            resampling=Resampling.bilinear,
        )

        west = transform.c
        north = transform.f
        east = west + transform.a * width
        south = north + transform.e * height

        valid_time = src.tags(SMOKE_BAND).get("GRIB_VALID_TIME", "?")

    print(f"Full bounds: west={west}, south={south}, east={east}, north={north}")
    print(f"Value range: min={np.nanmin(data)}, max={np.nanmax(data)}")
    print(f"99.9th percentile: {np.percentile(data, 99.9)}")

    # Crop to CONUS region
    col_start = int((CONUS_BOUNDS["west"] - west) / (east - west) * width)
    col_end   = int((CONUS_BOUNDS["east"] - west) / (east - west) * width)
    row_start = int((north - CONUS_BOUNDS["north"]) / (north - south) * height)
    row_end   = int((north - CONUS_BOUNDS["south"]) / (north - south) * height)

    col_start, col_end = max(0, col_start), min(width, col_end)
    row_start, row_end = max(0, row_start), min(height, row_end)

    cropped = data[row_start:row_end, col_start:col_end]
    print(f"Cropped shape: {cropped.shape}")

    # Normalization tuned to this product range (99.9th pct ~2-3e-9)
    vmin, vmax = 1e-10, 3e-9
    data_clipped = np.clip(cropped, vmin, vmax)
    log_data = np.log10(data_clipped)
    log_min, log_max = np.log10(vmin), np.log10(vmax)
    norm = (log_data - log_min) / (log_max - log_min)
    norm = np.clip(norm, 0, 1)

    r = np.clip(255 * (0.6 + 0.4 * norm), 0, 255).astype(np.uint8)
    g = np.clip(255 * (0.8 - 0.6 * norm), 0, 255).astype(np.uint8)
    b = np.clip(40 * (1 - norm), 0, 255).astype(np.uint8)
    a = np.clip(255 * (norm ** 1.5), 0, 200).astype(np.uint8)

    rgba = np.dstack([r, g, b, a])
    img = Image.fromarray(rgba, mode="RGBA")
    out_png = OUT_PNG_TEMPLATE.format(forecast_hour)
    img.save(out_png)
    print(f"Saved {out_png} ({cropped.shape[1]}x{cropped.shape[0]})")

    return {
        "bounds": CONUS_BOUNDS,
        "run_date": date_str,
        "run_hour": run_hour,
        "forecast_hour": forecast_hour,
        "valid_time_epoch": valid_time,
    }

if __name__ == "__main__":
    result = convert_smoke(forecast_hour=12)
    print(result)

