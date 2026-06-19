export const AQI_COLORS = {
  "Good": "#00E400",
  "Moderate": "#FFFF00",
  "Unhealthy for Sensitive Groups": "#FF7E00",
  "Unhealthy": "#FF0000",
  "Very Unhealthy": "#8F3F97",
  "Hazardous": "#7E0023",
}

export const AQI_GUIDANCE = {
  "Good": "Air quality is satisfactory, and air pollution poses little or no risk.",
  "Moderate": "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.",
  "Unhealthy for Sensitive Groups": "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
  "Unhealthy": "Everyone may begin to experience health effects. Members of sensitive groups may experience more serious effects.",
  "Very Unhealthy": "Health alert: The risk of health effects is increased for everyone.",
  "Hazardous": "Health warning of emergency conditions. Everyone is more likely to be affected. Avoid all outdoor exertion.",
}

export function getCategory(aqi) {
  if (aqi <= 50)  return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy for Sensitive Groups"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}
