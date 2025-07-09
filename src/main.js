function fetchCityAQIData() {
  const city = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("dashboard")
    .getRange("I1")
    .getValue()
    .toLowerCase();

  const apiKey = PropertiesService.getScriptProperties().getProperty("API_KEY");
  const apiUrl = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${apiKey}&format=json&limit=1000`;

  const response = UrlFetchApp.fetch(apiUrl);
  const json = JSON.parse(response.getContentText());
  const records = json.records;

  const rawSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("city_raw") ||
                   SpreadsheetApp.getActiveSpreadsheet().insertSheet("city_raw");

  // Clear old data
  rawSheet.clearContents();

  // Add header
  rawSheet.appendRow([
    "City", "Station", "Last Update", "Latitude", "Longitude",
    "Pollutant ID", "Pollutant Min", "Pollutant Max", "Pollutant Avg"
  ]);


  const filtered = records.filter(r =>
    r.city && r.city.toLowerCase() === city &&
    r.avg_value !== "NA" && r.min_value !== "NA" && r.max_value !== "NA"
  );

  const data = filtered.map(r => [
    r.city,
    r.station,
    r.last_update,
    r.latitude,
    r.longitude,
    r.pollutant_id,
    Number(r.min_value),
    Number(r.max_value),
    Number(r.avg_value)
  ]);

  if (data.length > 0) {
    rawSheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  } else {
    rawSheet.appendRow(["No valid data found for selected city"]);
  }

}


function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("AQI Tools")
    .addItem("Fetch Data for Selected City", "fetchCityAQIData")
    .addItem("Compute Station AQI", "calculateStationAQI")
    .addToUi();
}














