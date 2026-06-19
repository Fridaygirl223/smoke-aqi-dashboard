import { useState } from "react"
import MapView from "./components/MapView.jsx"
import LayerControls from "./components/LayerControls.jsx"
import AQIPanel from "./components/AQIPanel.jsx"
import TimeSlider from "./components/TimeSlider.jsx"

const FORECAST_HOURS = [0,3,6,9,12,15,18,21]

export default function App() {
  const [selectedStation, setSelectedStation] = useState(null)
  const [smokeHour, setSmokeHour] = useState(12)
  const [smokeOpacity, setSmokeOpacity] = useState(0.7)
  const [smokeVisible, setSmokeVisible] = useState(true)
  const [aqiVisible, setAqiVisible] = useState(true)
  const [baseStyle, setBaseStyle] = useState("dark")
  const [smokeMeta, setSmokeMeta] = useState(null)

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{"\u{1F525}"}</span>
          <h1 className="font-bold text-base">Smoke & Air Quality Dashboard</h1>
        </div>
        <div className="flex gap-1">
          {["light","dark"].map(s => (
            <button
              key={s}
              onClick={() => setBaseStyle(s)}
              className={`px-3 py-1 text-xs rounded capitalize transition-colors ${
                baseStyle === s ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MapView
            smokeHour={smokeHour}
            smokeOpacity={smokeOpacity}
            smokeVisible={smokeVisible}
            aqiVisible={aqiVisible}
            baseStyle={baseStyle}
            onStationClick={setSelectedStation}
            onSmokeMetaChange={setSmokeMeta}
          />
          <div className="absolute top-3 left-3 z-10 w-[28rem]">
            <LayerControls
              smokeVisible={smokeVisible} onSmokeToggle={setSmokeVisible}
              aqiVisible={aqiVisible} onAqiToggle={setAqiVisible}
            />
          </div>
          <div className="absolute bottom-3 left-3 right-3 md:right-80 z-10">
            <TimeSlider
              hours={FORECAST_HOURS}
              selectedHour={smokeHour}
              onHourChange={setSmokeHour}
              smokeMeta={smokeMeta}
            />
          </div>
        </div>

        <aside className="hidden md:flex w-72 flex-col bg-gray-900 border-l border-gray-800 shrink-0">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Air Quality Details</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <AQIPanel selectedStation={selectedStation} />
          </div>
        </aside>
      </div>
    </div>
  )
}
