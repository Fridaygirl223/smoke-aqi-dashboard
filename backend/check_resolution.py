import rasterio

url = "/vsicurl/https://noaa-rap-pds.s3.amazonaws.com/rap.20260614/rap.t18z.awip32f12.grib2"

with rasterio.open(url) as src:
    print("CRS:", src.crs)
    print("Width x Height:", src.width, "x", src.height)
    print("Bounds:", src.bounds)

    band = 499
    data = src.read(band)
    import numpy as np
    print("min:", np.nanmin(data))
    print("max:", np.nanmax(data))
    print("99th percentile:", np.percentile(data, 99))
    print("99.9th percentile:", np.percentile(data, 99.9))

