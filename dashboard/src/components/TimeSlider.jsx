import { useEffect, useRef, useState } from "react"

export default function TimeSlider({ hours, selectedHour, onHourChange, smokeMeta }) {
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef(null)

  function togglePlay() {
    if (playing) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    } else {
      intervalRef.current = setInterval(() => {
        onHourChange(prev => {
          const idx = hours.indexOf(prev)
          return hours[(idx + 1) % hours.length]
        })
      }, 2000)
    }
    setPlaying(p => !p)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const currentIdx = hours.indexOf(selectedHour)

  // Compute the model run start time (run_date + run_hour, UTC)
  let runStartMs = null
  if (smokeMeta && smokeMeta.runDate && smokeMeta.runHour !== undefined) {
    const y = parseInt(smokeMeta.runDate.slice(0,4))
    const mo = parseInt(smokeMeta.runDate.slice(4,6)) - 1
    const d = parseInt(smokeMeta.runDate.slice(6,8))
    runStartMs = Date.UTC(y, mo, d, smokeMeta.runHour, 0, 0)
  }

  function timeForHour(h) {
    if (runStartMs === null) return null
    return new Date(runStartMs + h * 3600 * 1000)
  }

  function formatTick(date) {
    if (!date) return ""
    const opts = { month: "short", day: "numeric", hour: "numeric", hour12: true, timeZone: "UTC" }
    return date.toLocaleString("en-US", opts).replace(",", "")
  }

  let validTimeLabel = "Loading..."
  if (smokeMeta && smokeMeta.validTimeEpoch) {
    const epoch = parseInt(smokeMeta.validTimeEpoch, 10)
    if (!isNaN(epoch)) {
      const date = new Date(epoch * 1000)
      validTimeLabel = date.toISOString().slice(0,16).replace("T"," ") + " UTC"
    }
  }

  return (
    <div className="bg-gray-900/90 backdrop-blur text-white p-3 rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full transition-colors"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={hours.length - 1}
          value={currentIdx}
          onChange={e => onHourChange(hours[parseInt(e.target.value)])}
          className="flex-1 accent-blue-400"
        />
        <span className="text-xs text-gray-300 w-12 text-right">
          +{selectedHour}h
        </span>
      </div>

      {/* Tick labels showing actual valid times */}
      <div className="flex justify-between text-[10px] text-gray-400 px-1 mb-1">
        {hours.map(h => (
          <button
            key={h}
            onClick={() => onHourChange(h)}
            className={[
              "px-1 rounded transition-colors text-center leading-tight",
              h === selectedHour ? "text-blue-400 font-bold" : "hover:text-white"
            ].join(" ")}
            style={{ minWidth: "44px" }}
          >
            {formatTick(timeForHour(h)) || `+${h}h`}
          </button>
        ))}
      </div>

      <div className="text-center text-xs text-gray-400">
        Valid: {validTimeLabel}
      </div>
    </div>
  )
}
