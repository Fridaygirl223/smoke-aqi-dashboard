import rasterio

path = r"C:\Users\hudso\OneDrive\Desktop\Wet_Dog\rap_smokeCS.t03z.sfc.1hr_227.grib2"

with rasterio.open(path) as src:
    for i in range(1, src.count + 1):
        tags = src.tags(i)
        fcst = tags.get("GRIB_FORECAST_SECONDS", "?")
        short = tags.get("GRIB_SHORT_NAME", "?")
        print(f"Band {i}: forecast_seconds={fcst}, short_name={short}")

