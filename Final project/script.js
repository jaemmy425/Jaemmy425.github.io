// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoiamFlbW15IiwiYSI6ImNtNXdqNGRxbjBmaDkybnNhZmZzejVnOHkifQ.tOBRUBILjsKJ_kiyZTq1zA";

const map = new mapboxgl.Map({
  container: "map", // container element id
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-0.089932, 51.514442],
  zoom: 6
});

// Add Geocoder search control
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false, // Do not use the default marker style
  placeholder: "Search for places England", // Placeholder text for the search bar
  proximity: {
    longitude: -4.2518, // Corrected Longitude for Glasgow
    latitude: 55.8642 // Corrected Latitude for Glasgow
  } // Coordinates of Glasgow center
});
// Add the geocoder control to the top-right of the map
map.addControl(geocoder, "top-right");
map.addControl(new mapboxgl.NavigationControl());

// Add Geolocate control (find my current location)
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  }),
  "top-right"
);
const data_url =
  "https://api.mapbox.com/datasets/v1/jaemmy/cm781e0hv0yo41ophya8bqrfu/features?access_token=pk.eyJ1IjoiamFlbW15IiwiYSI6ImNtNXdqNGRxbjBmaDkybnNhZmZzejVnOHkifQ.tOBRUBILjsKJ_kiyZTq1zA";

map.on("load", () => {
  map.addLayer({
    id: "Ozone",
    type: "circle",
    source: {
      type: "geojson",
      data: data_url
    },
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["to-number", ["get", "Ozone"]],
        0,
        4, // 臭氧0，圆点半径 4px
        33,
        6, // 臭氧33，圆点半径 6px
        54,
        8, // 臭氧54，圆点半径 8px
        70,
        10, // 臭氧70，圆点半径 10px
        85,
        12, // 臭氧85，圆点半径 12px
        97,
        14 // 臭氧97，圆点半径 14px
      ],
      "circle-opacity": 1,
      "circle-color": [
        "case",
        // Very Good (0-33)
        ["<=", ["to-number", ["get", "Ozone"]], 33],
        "hsl(125, 70%, 50%)", // 柔和的绿色
        // Good (34-54)
        ["<=", ["to-number", ["get", "Ozone"]], 54],
        "hsl(50, 90%, 55%)", // 柔和的黄色
        // Moderate (55-70)
        ["<=", ["to-number", ["get", "Ozone"]], 70],
        "hsl(30, 85%, 60%)", // 稍微降低饱和度的橙色
        // Unhealthy for Sensitive Groups (71-85)
        ["<=", ["to-number", ["get", "Ozone"]], 85],
        "hsl(10, 80%, 60%)", // 温和的红色
        // Unhealthy (86+)
        "hsl(280, 70%, 55%)" // 柔和的紫色
      ]
    }
  });

  //滑块

  document.getElementById("slider").addEventListener("input", (event) => {
    const value = parseInt(event.target.value);
    let year, month;

    if (value >= 1 && value <= 4) {
      year = 2023;
      month = 8 + value; // 9月开始
    } else if (value >= 5 && value <= 16) {
      year = 2024;
      month = value - 4; // 从2024年1月开始
    } else {
      year = 2025;
      month = value - 16; // 从2025年1月开始
    }

    const formattedMonth = `${year}-${("0" + month).slice(-2)}`;
    console.log("Current selected month:", formattedMonth);

    selectedMonth = formattedMonth;

    if (map.getLayer("Ozone")) {
      updateMap(selectedZone, selectedMonth);
    }

    document.getElementById("active-month").innerText = formattedMonth;
  });
});
document.getElementById("Zone").addEventListener("change", function () {
  selectedZone = this.value; // 获取选中的 Zone
  updateMap(selectedZone, selectedMonth); // 更新地图
});

let selectedZone = "all"; // 初始化默认区域
let selectedMonth = "2023-09"; // 初始化默认月份

function updateMap(zone, month) {
  console.log(`Filtering data for Zone: ${zone}, Month: ${month}`);

  // 先移除旧的过滤器
  if (map.getLayer("Ozone")) {
    let filters = ["all", ["==", ["to-string", ["get", "Month"]], month]];

    if (zone !== "all") {
      filters.push(["==", ["to-string", ["get", "Zone"]], zone]);
    }

    // 更新地图的筛选条件
    map.setFilter("Ozone", filters);
  }
}

//pop-up
map.on("click", (event) => {
  // Get the features at the clicked location
  const features = map.queryRenderedFeatures(event.point, {
    layers: ["Ozone"] // Ensure this is the correct layer name
  });
  console.log("Features at clicked point:", features);

  if (!features.length) {
    console.log("No features found at this location.");
    return;
  }

  const feature = features[0];

  // Create a popup with information about the feature
  const popup = new mapboxgl.Popup({ offset: [0, -5], className: "my-popup" })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(
      `
      <h3>📍${feature.properties.Sitename}</h3>
      <p><strong>Date:</strong> ${feature.properties.Month}</p>
      <p><strong>Site Type:</strong> ${feature.properties["Site Type"]}</p>
      <p><strong>Zone:</strong> ${feature.properties.Zone}</p>
      <p><strong>Ozone:</strong> ${feature.properties["Ozone"]}</p>
      <p><strong>Unit:</strong> ${feature.properties.Status}</p>
    `
    )
    .addTo(map);
});
// Create the chart container (right side)
let ozoneChart = new Chart(document.getElementById("ozone-chart"), {
  type: "line",
  data: {
    labels: [], // X-axis: Month
    datasets: [
      {
        label: "Ozone concentrations",
        data: [], // Y-axis: Ozone concentration
        borderColor: "rgba(75, 192, 192, 1)",
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: "Month"
        }
      },
      y: {
        title: {
          display: true,
          text: "Ozone Levels(ug/m³)"
        },
        min: 0
      }
    }
  }
});

// Map Hover Event
map.on("mousemove", (event) => {
  const features = map.queryRenderedFeatures(event.point, {
    layers: ["Ozone"]
  });

  if (!features.length) {
    return;
  }

  const feature = features[0];
  const zone = feature.properties.Zone; // Zone name
  const sitename = feature.properties.Sitename; // Site name

  console.log("Hovering over site:", sitename, "Zone:", zone);

  // Get historical data from the map features (already in GeoJSON)
  const filteredData = features.filter((item) => item.properties.Zone === zone);

  if (filteredData.length > 0) {
    const months = filteredData.map((item) => item.properties.Month);
    const ozoneLevels = filteredData.map((item) => item.properties.Ozone);

    // Update the chart with the filtered data
    updateChart(months, ozoneLevels);
  }
});

// Update the chart with new data
function updateChart(months, ozoneLevels) {
  ozoneChart.data.labels = months; // Set months as labels
  ozoneChart.data.datasets[0].data = ozoneLevels; // Set ozone levels as data
  ozoneChart.update(); // Update the chart
}