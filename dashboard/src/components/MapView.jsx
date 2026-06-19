import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

const STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
}

const BACKEND = "http://localhost:8000"

export default function MapView({
  smokeOpacity, smokeVisible, smokeHour, aqiVisible, baseStyle, onStationClick, onSmokeMetaChange
}) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const popup = useRef(null)
  const mapLoaded = useRef(false)
  const aqiVisibleRef = useRef(aqiVisible)
  const smokeVisibleRef = useRef(smokeVisible)
  const smokeOpacityRef = useRef(smokeOpacity)

  useEffect(() => { aqiVisibleRef.current = aqiVisible }, [aqiVisible])
  useEffect(() => { smokeVisibleRef.current = smokeVisible }, [smokeVisible])
  useEffect(() => { smokeOpacityRef.current = smokeOpacity }, [smokeOpacity])

  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLES[baseStyle],
      center: [-98.5, 39.5],
      zoom: 4,
    })

    map.current.addControl(new maplibregl.NavigationControl(), "top-right")

    map.current.on("load", () => {
      mapLoaded.current = true
      addAQILayer()
      loadSmokeLayer(smokeHour)
    })

    return () => {
      mapLoaded.current = false
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Switch base map style when baseStyle changes
  useEffect(() => {
    const m = map.current
    if (!m || !mapLoaded.current) return

    m.setStyle(STYLES[baseStyle])
    m.once("style.load", () => {
      if (!m.getSource("aqi-stations")) {
        addAQILayer()
        const vis = aqiVisibleRef.current ? "visible" : "none"
        m.setLayoutProperty("aqi-circle", "visibility", vis)
        m.setLayoutProperty("aqi-label", "visibility", vis)
      }
      if (!m.getSource("smoke-overlay")) {
        loadSmokeLayer(smokeHour)
      }
    })
  }, [baseStyle])

  // Re-fetch smoke when forecast hour changes
  useEffect(() => {
    const m = map.current
    if (!m || !mapLoaded.current) return
    loadSmokeLayer(smokeHour)
  }, [smokeHour])

  async function loadSmokeLayer(forecastHour) {
    const m = map.current
    if (!m) return

    try {
      const resp = await fetch(`${BACKEND}/smoke/bounds?forecast_hour=${forecastHour}`)
      const data = await resp.json()
      const { image, bounds } = data

      const coordinates = [
        [bounds.west, bounds.north],
        [bounds.east, bounds.north],
        [bounds.east, bounds.south],
        [bounds.west, bounds.south],
      ]

      const source = m.getSource("smoke-overlay")
      if (source) {
        // Update existing source image + coordinates
        source.updateImage({ url: image, coordinates })
      } else {
        m.addSource("smoke-overlay", {
          type: "image",
          url: image,
          coordinates,
        })

        m.addLayer({
          id: "smoke-layer",
          type: "raster",
          source: "smoke-overlay",
          paint: {
            "raster-opacity": smokeOpacityRef.current,
            "raster-fade-duration": 0,
          },
          layout: {
            visibility: smokeVisibleRef.current ? "visible" : "none",
          },
        })
      }
      if (onSmokeMetaChange) {
        onSmokeMetaChange({
          runDate: data.run_date,
          runHour: data.run_hour,
          forecastHour: data.forecast_hour,
          validTimeEpoch: data.valid_time_epoch,
        })
      }
    } catch (err) {
      console.error("Failed to load smoke overlay:", err)
    }
  }

  function addAQILayer() {
    const m = map.current
    if (!m) return

    m.addSource("aqi-stations", {
      type: "geojson",
      data: `${BACKEND}/aqi/stations`,
    })

    m.addLayer({
      id: "aqi-circle",
      type: "circle",
      source: "aqi-stations",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "aqi"], 0, 13, 200, 26],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "rgba(0,0,0,0.4)",
        "circle-opacity": 0.9,
      },
    })

    m.addLayer({
      id: "aqi-label",
      type: "symbol",
      source: "aqi-stations",
      layout: {
        "text-field": ["to-string", ["get", "aqi"]],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 13,
        "text-anchor": "center",
      },
      paint: {
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    })

    m.on("click", "aqi-circle", (e) => {
      const props = e.features[0].properties
      const coords = e.features[0].geometry.coordinates

      popup.current?.remove()
      popup.current = new maplibregl.Popup({ offset: 20 })
        .setLngLat(coords)
        .setHTML(`
          <div style="padding:10px;min-width:160px;font-family:sans-serif">
            <div style="font-weight:bold;margin-bottom:4px">${props.station_name}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${props.color}"></span>
              <span style="font-size:1.2em;font-weight:bold">${props.aqi}</span>
              <span style="color:#666;font-size:0.85em">${props.category}</span>
            </div>
            <div style="color:#888;font-size:0.8em">${props.pollutant}</div>
          </div>
        `)
        .addTo(m)

      onStationClick(props)
    })

    m.on("mouseenter", "aqi-circle", () => {
      m.getCanvas().style.cursor = "pointer"
    })
    m.on("mouseleave", "aqi-circle", () => {
      m.getCanvas().style.cursor = ""
    })
  }

  useEffect(() => {
    const m = map.current
    if (!m || !mapLoaded.current) return
    if (!m.getLayer("aqi-circle")) return
    const vis = aqiVisible ? "visible" : "none"
    m.setLayoutProperty("aqi-circle", "visibility", vis)
    m.setLayoutProperty("aqi-label", "visibility", vis)
  }, [aqiVisible])

  useEffect(() => {
    const m = map.current
    if (!m || !mapLoaded.current) return
    if (!m.getLayer("smoke-layer")) return
    const vis = smokeVisible ? "visible" : "none"
    m.setLayoutProperty("smoke-layer", "visibility", vis)
  }, [smokeVisible])

  useEffect(() => {
    const m = map.current
    if (!m || !mapLoaded.current) return
    if (!m.getLayer("smoke-layer")) return
    m.setPaintProperty("smoke-layer", "raster-opacity", smokeOpacity)
  }, [smokeOpacity])

  return (
    <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
  )
}
