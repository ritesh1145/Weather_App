document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const darkModeBtn = document.querySelector(".mode-btn.dark");
    const lightModeBtn = document.querySelector(".mode-btn.light");
    const tempBtns = document.querySelectorAll(".temp-btn");
    const searchBtn = document.querySelector(".search-btn");
    const searchInput = document.getElementById("Location");
    const locationDisplay = document.getElementById("location-display");
    const forecastCards = document.getElementById("forecast-cards");
    const mapContainer = document.getElementById("map-container");
    const mapWeatherIcon = document.getElementById("map-weather-icon");
    const mapLocationName = document.getElementById("map-location-name");
    const mapWeatherTemp = document.getElementById("map-weather-temp");

    const apiKey = "0422467bc618bc1f3820030b4110454b";
    let currentTempC = null;
    let forecastData = null;
    let currentMap = null;

    function applyTheme(isDark) {
        body.classList.toggle("dark-mode", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    darkModeBtn?.addEventListener("click", () => applyTheme(true));
    lightModeBtn?.addEventListener("click", () => applyTheme(false));

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") applyTheme(true);

    function updateTemperatureUI(tempCelsius) {
        currentTempC = tempCelsius;
        const isFahrenheit = document.querySelector(".temp-btn.fahrenheit")?.classList.contains("active");
        const displayTemp = isFahrenheit
            ? Math.round(tempCelsius * 9 / 5 + 32)
            : Math.round(tempCelsius);
        const unit = isFahrenheit ? "F" : "C";
        document.querySelector(".weather-info h1").textContent = `${displayTemp}°${unit}`;
        
        // Update map temperature display
        if (mapWeatherTemp) {
            mapWeatherTemp.textContent = `${displayTemp}°${unit}`;
        }
    }

    tempBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tempBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            localStorage.setItem("tempUnit", btn.classList.contains("fahrenheit") ? "F" : "C");

            if (currentTempC !== null) updateTemperatureUI(currentTempC);
            if (forecastData) renderForecast(forecastData);
        });
    });

    const savedUnit = localStorage.getItem("tempUnit");
    if (savedUnit) {
        document.querySelector(`.temp-btn.${savedUnit === "F" ? "fahrenheit" : "celsius"}`)?.classList.add("active");
    } else {
        document.querySelector(".temp-btn.celsius")?.classList.add("active");
    }

    async function updateLocationText(lat, lon) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown";
            if (locationDisplay) {
                locationDisplay.innerHTML = `<p>Your Location: <strong>${city}</strong></p>`;
            }
            if (mapLocationName) {
                mapLocationName.textContent = city;
            }
        } catch {
            if (locationDisplay) {
                locationDisplay.innerHTML = `<p>Your Location: <strong>Unknown</strong></p>`;
            }
            if (mapLocationName) {
                mapLocationName.textContent = "Unknown";
            }
        }
    }

    async function initMap(lat, lon, weatherCondition) {
        // Load Google Maps API if not already loaded
        if (!window.google || !window.google.maps) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY`;
            document.head.appendChild(script);
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }

        // Clear previous map if exists
        if (currentMap) {
            currentMap = null;
            mapContainer.innerHTML = '';
        }

        // Create new map
        currentMap = new google.maps.Map(mapContainer, {
            center: { lat, lng: lon },
            zoom: 10,
            disableDefaultUI: true,
            styles: [
                {
                    featureType: "all",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ visibility: "simplified" }]
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#4a90e2" }]
                }
            ]
        });

        // Add marker with weather-appropriate color
        const markerColor = getMarkerColor(weatherCondition);
        new google.maps.Marker({
            position: { lat, lng: lon },
            map: currentMap,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: markerColor,
                fillOpacity: 0.9,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 8
            }
        });
    }

    function getMarkerColor(weatherCondition) {
        const condition = weatherCondition.main.toLowerCase();
        const colors = {
            'clear': '#FFD700', // gold
            'clouds': '#A9A9A9', // dark gray
            'rain': '#1E90FF', // dodger blue
            'snow': '#FFFFFF', // white
            'thunderstorm': '#9400D3', // dark violet
            'drizzle': '#87CEEB', // sky blue
            'mist': '#D3D3D3', // light gray
            'default': '#4a90e2' // blue
        };
        return colors[condition] || colors.default;
    }

    function updateWeatherUI(data) {
        currentTempC = data.main.temp;
        updateTemperatureUI(currentTempC);

        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        document.querySelector(".weather-info p").innerHTML = `
            <img src="${iconUrl}" alt="${data.weather[0].description}" style="vertical-align:middle; width:40px; height:40px;"> 
            ${data.weather[0].description}
        `;

        document.querySelector(".details").innerHTML = `
            <p>Air Quality: <span>N/A</span></p>
            <p>Wind: <span>${data.wind.speed} m/s</span></p>
            <p>Humidity: <span>${data.main.humidity}%</span></p>
            <p>Feels Like: <span>${Math.round(data.main.feels_like)}°C</span></p>
            <p>Visibility: <span>${(data.visibility / 1000).toFixed(1)} km</span></p>
            <p>Pressure: <span>${data.main.pressure} mb</span></p>
            <p>Dew Point: <span>N/A</span></p>
        `;

        // Update map weather icon
        if (mapWeatherIcon) {
            mapWeatherIcon.src = iconUrl;
            mapWeatherIcon.alt = data.weather[0].description;
        }

        // Initialize map with current location and weather
        initMap(data.coord.lat, data.coord.lon, data.weather[0]);
    }

    async function fetchWeatherByCity(city) {
        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (!geoData.length) throw new Error("City not found");

            const { lat, lon } = geoData[0];
            fetchWeatherByCoords(lat, lon);
        } catch (error) {
            alert("Error: " + error.message);
        }
    }

    async function fetchWeatherByCoords(lat, lon) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.cod !== 200) throw new Error(data.message);

            updateWeatherUI(data);
            updateLocationText(lat, lon);
            fetchForecast(lat, lon);
        } catch (error) {
            alert("Failed to fetch weather data: " + error.message);
        }
    }

    async function fetchForecast(lat, lon) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            forecastData = data.daily.slice(0, 7); // next 7 days
            renderForecast(forecastData);
        } catch (err) {
            console.error("Forecast fetch error:", err);
        }
    }

    function renderForecast(days) {
        const isFahrenheit = document.querySelector(".temp-btn.fahrenheit")?.classList.contains("active");
        forecastCards.innerHTML = "";

        days.forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
            let min = Math.round(day.temp.min);
            let max = Math.round(day.temp.max);
            if (isFahrenheit) {
                min = Math.round(min * 9 / 5 + 32);
                max = Math.round(max * 9 / 5 + 32);
            }

            forecastCards.innerHTML += `
                <div class="card">
                    <p>${dayName}</p>
                    <img src="${icon}" alt="${day.weather[0].description}">
                    <p>${max}° / ${min}°</p>
                </div>
            `;
        });
    }

    searchBtn?.addEventListener("click", () => {
        const city = searchInput?.value.trim();
        if (city) fetchWeatherByCity(city);
    });

    searchInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const city = searchInput.value.trim();
            if (city) fetchWeatherByCity(city);
        }
    });

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            () => {
                if (locationDisplay) {
                    locationDisplay.innerHTML = `<p>Location access denied.</p>`;
                }
                // Default to a known location if geolocation is denied
                fetchWeatherByCoords(51.5074, -0.1278); // London as fallback
            }
        );
    } else {
        if (locationDisplay) {
            locationDisplay.innerHTML = `<p>Geolocation not supported.</p>`;
        }
        // Default to a known location if geolocation isn't supported
        fetchWeatherByCoords(51.5074, -0.1278); // London as fallback
    }
});