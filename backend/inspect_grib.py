import rasterio

path = r"C:\Users\hudso\OneDrive\Desktop\Wet_Dog\rap_smokeCS.t03z.sfc.1hr_227.grib2"

with rasterio.open(path) as src:
    print("Driver:", src.driver)
    print("CRS:", src.crs)
    print("Bounds:", src.bounds)
    print("Width x Height:", src.width, "x", src.height)
    print("Band count:", src.count)
    for i in range(1, src.count + 1):
        tags = src.tags(i)
        print(f"  Band {i}:", tags.get("GRIB_COMMENT", "?"), "|", tags.get("GRIB_ELEMENT", "?"), "| units:", tags.get("GRIB_UNIT", "?"))

