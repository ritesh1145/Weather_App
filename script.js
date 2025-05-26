document.getElementById('getWeather').addEventListener('click', function() {
    const city = document.getElementById('cityInput').value;
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener('readystatechange', function () {
        if (this.readyState === this.DONE) {
            const response = JSON.parse(this.responseText);
            document.getElementById('weatherInfo').innerHTML = `
                <h3>Weather in ${city}</h3>
                <p>Temperature: ${response.temp}°C</p>
                <p>Humidity: ${response.humidity}%</p>
                <p>Wind Speed: ${response.wind_speed} km/h</p>
            `;
        }
    });

    xhr.open('GET', `https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?city=${city}`);
    xhr.setRequestHeader('x-rapidapi-key', 'YOUR_API_KEY_HERE');
    xhr.setRequestHeader('x-rapidapi-host', 'weather-by-api-ninjas.p.rapidapi.com');

    xhr.send(null);
});