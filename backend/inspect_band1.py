import rasterio
import numpy as np

path = r"C:\Users\hudso\OneDrive\Desktop\Wet_Dog\rap_smokeCS.t03z.sfc.1hr_227.grib2"

with rasterio.open(path) as src:
    print("=== Band 1 full tags ===")
    for k, v in src.tags(1).items():
        print(f"  {k}: {v}")

    print()
    print("=== Value stats for band 1 ===")
    data = src.read(1)
    print("min:", np.nanmin(data))
    print("max:", np.nanmax(data))
    print("mean:", np.nanmean(data))
    print("nonzero count:", np.count_nonzero(data))
    print("total pixels:", data.size)

