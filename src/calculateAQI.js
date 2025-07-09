function calculateStationAQI() {
  const rawSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("city_raw");
  const aqiSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("station_aqi") ||
                   SpreadsheetApp.getActiveSpreadsheet().insertSheet("station_aqi");

  // Clear previous output
  aqiSheet.clearContents();
  aqiSheet.appendRow(["City", "Station", "Last Update", "Latitude", "Longitude", "Final AQI", "Dominant Pollutant"]);

  const data = rawSheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const pollutantBreakpoints = {
  "PM2.5": [
    { low: 0, high: 30, Ilow: 0, Ihigh: 50 },
    { low: 31, high: 60, Ilow: 51, Ihigh: 100 },
    { low: 61, high: 90, Ilow: 101, Ihigh: 200 },
    { low: 91, high: 120, Ilow: 201, Ihigh: 300 },
    { low: 121, high: 250, Ilow: 301, Ihigh: 400 },
    { low: 251, high: 500, Ilow: 401, Ihigh: 500 }
  ],
  "PM10": [
    { low: 0, high: 50, Ilow: 0, Ihigh: 50 },
    { low: 51, high: 100, Ilow: 51, Ihigh: 100 },
    { low: 101, high: 250, Ilow: 101, Ihigh: 200 },
    { low: 251, high: 350, Ilow: 201, Ihigh: 300 },
    { low: 351, high: 430, Ilow: 301, Ihigh: 400 },
    { low: 431, high: 600, Ilow: 401, Ihigh: 500 }
  ],
  "NO2": [
    { low: 0, high: 40, Ilow: 0, Ihigh: 50 },
    { low: 41, high: 80, Ilow: 51, Ihigh: 100 },
    { low: 81, high: 180, Ilow: 101, Ihigh: 200 },
    { low: 181, high: 280, Ilow: 201, Ihigh: 300 },
    { low: 281, high: 400, Ilow: 301, Ihigh: 400 },
    { low: 401, high: 800, Ilow: 401, Ihigh: 500 }
  ],
  "SO2": [
    { low: 0, high: 40, Ilow: 0, Ihigh: 50 },
    { low: 41, high: 80, Ilow: 51, Ihigh: 100 },
    { low: 81, high: 380, Ilow: 101, Ihigh: 200 },
    { low: 381, high: 800, Ilow: 201, Ihigh: 300 },
    { low: 801, high: 1600, Ilow: 301, Ihigh: 400 },
    { low: 1601, high: 2000, Ilow: 401, Ihigh: 500 }
  ],
  "OZONE": [
    { low: 0, high: 50, Ilow: 0, Ihigh: 50 },
    { low: 51, high: 100, Ilow: 51, Ihigh: 100 },
    { low: 101, high: 168, Ilow: 101, Ihigh: 200 },
    { low: 169, high: 208, Ilow: 201, Ihigh: 300 },
    { low: 209, high: 748, Ilow: 301, Ihigh: 400 },
    { low: 749, high: 1000, Ilow: 401, Ihigh: 500 }
  ],
  "CO": [
    { low: 0.0, high: 1.0, Ilow: 0, Ihigh: 50 },
    { low: 1.1, high: 2.0, Ilow: 51, Ihigh: 100 },
    { low: 2.1, high: 10.0, Ilow: 101, Ihigh: 200 },
    { low: 10.1, high: 17.0, Ilow: 201, Ihigh: 300 },
    { low: 17.1, high: 34.0, Ilow: 301, Ihigh: 400 },
    { low: 34.1, high: 50.0, Ilow: 401, Ihigh: 500 }
  ],
  "NH3": [
    { low: 0, high: 200, Ilow: 0, Ihigh: 50 },
    { low: 201, high: 400, Ilow: 51, Ihigh: 100 },
    { low: 401, high: 800, Ilow: 101, Ihigh: 200 },
    { low: 801, high: 1200, Ilow: 201, Ihigh: 300 },
    { low: 1201, high: 1800, Ilow: 301, Ihigh: 400 },
    { low: 1801, high: 2400, Ilow: 401, Ihigh: 500 }
  ]
};


  const stationsMap = {};

  rows.forEach(row => {
    const [city, station, lastUpdate, lat, long, pollutant, , , avg] = row;
    if (!pollutantBreakpoints[pollutant]) return;

    const breakpoints = pollutantBreakpoints[pollutant];
    const match = breakpoints.find(bp => avg >= bp.low && avg <= bp.high);
    if (!match) return;

    const aqi = Math.round(
      ((match.Ihigh - match.Ilow) / (match.high - match.low)) * (avg - match.low) + match.Ilow
    );

    const key = `${station}_${lastUpdate}`;
    if (!stationsMap[key]) {
      stationsMap[key] = {
        city,
        station,
        lastUpdate,
        lat,
        long,
        maxAQI: aqi,
        pollutant: pollutant
      };
    } else {
      if (aqi > stationsMap[key].maxAQI) {
        stationsMap[key].maxAQI = aqi;
        stationsMap[key].pollutant = pollutant;
      }
    }
  });

  // Write to sheet
  Object.values(stationsMap).forEach(entry => {
    aqiSheet.appendRow([
      entry.city,
      entry.station,
      entry.lastUpdate,
      entry.lat,
      entry.long,
      entry.maxAQI,
      entry.pollutant
    ]);
  });
}
