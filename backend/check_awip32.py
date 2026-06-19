import rasterio

url = "/vsicurl/https://noaa-rap-pds.s3.amazonaws.com/rap.20260614/rap.t00z.awip32f00.grib2"

with rasterio.open(url) as src:
    print("Band count:", src.count)
    massden_bands = []
    for i in range(1, src.count + 1):
        tags = src.tags(i)
        elem = tags.get("GRIB_ELEMENT", "")
        if "MASSDEN" in elem or "smoke" in tags.get("GRIB_COMMENT","").lower():
            massden_bands.append((i, elem, tags.get("GRIB_COMMENT","")))
    print("Smoke-related bands found:", len(massden_bands))
    for b in massden_bands[:10]:
        print(" ", b)

