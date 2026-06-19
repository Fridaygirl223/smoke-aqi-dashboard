import { AQI_COLORS, AQI_GUIDANCE } from "../utils/aqiUtils.js"

export default function AQIPanel({ selectedStation }) {
  if (!selectedStation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm text-center p-6">
        <div className="text-4xl mb-3">📍</div>
        <p>Click a station on the map to see AQI details.</p>
      </div>
    )
  }

  const { station_name, aqi, category, pollutant, timestamp, color } = selectedStation
  const guidance = AQI_GUIDANCE[category] || ""
  const categories = Object.entries(AQI_COLORS)

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
      <div>
        <h2 className="font-bold text-lg text-white leading-tight">{station_name}</h2>
        <p className="text-gray-400 text-sm">{timestamp}</p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {aqi}
        </div>
        <div>
          <div className="font-semibold text-white">{category}</div>
          <div className="text-gray-400 text-xs mt-1">{pollutant}</div>
        </div>
      </div>

      <div>
        <div className="flex rounded overflow-hidden h-3 mb-1">
          {categories.map(([cat, clr]) => (
            <div
              key={cat}
              className="flex-1"
              style={{
                backgroundColor: clr,
                opacity: cat === category ? 1 : 0.3,
              }}
              title={cat}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300+</span>
        </div>
      </div>

      <div
        className="rounded-lg p-3 border-l-4 text-sm"
        style={{ borderColor: color, backgroundColor: color + "22" }}
      >
        <div className="font-semibold text-white mb-1">Health Guidance</div>
        <p className="text-gray-300 leading-snug">{guidance}</p>
      </div>
    </div>
  )
}
