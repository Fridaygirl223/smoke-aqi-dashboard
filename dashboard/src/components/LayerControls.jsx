export default function LayerControls({
  smokeVisible, onSmokeToggle,
  aqiVisible, onAqiToggle
}) {
  return (
    <div className="bg-gray-900/90 backdrop-blur text-white p-5 rounded-lg shadow-lg text-base leading-relaxed">
      <div className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
        Layers
      </div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={smokeVisible}
            onChange={e => onSmokeToggle(e.target.checked)}
            className="accent-orange-400"
          />
          <span>{"\u{1F525}"} Smoke</span>
        </label>
      </div>
      <div className="text-xs text-gray-500 pl-7 mb-5">
        NOAA RAP Forecast
      </div>
      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={aqiVisible}
            onChange={e => onAqiToggle(e.target.checked)}
            className="accent-blue-400"
          />
          <span>{"\u{1F4CD}"} AQI Stations</span>
        </label>
      </div>
      <div className="text-xs text-gray-500 pl-7">
        EPA AirNow &mdash; Live Observations
      </div>
    </div>
  )
}