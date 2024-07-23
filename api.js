const apiKey = ;
const apiURL = "https://restcountries.com/v3.1/all?fields=name,flags";
;
const searchBox = document.querySelector(".search input");
const searchButton = document.querySelector(".search button");

async function checkData(country) {
    const response =  await fetch (apiUrl + country + `&appiid=${apiKey}`);
    let data = await response.json();
    document.querySelector(".info-popup").innerHTML = data.flag;
    //etc//
}

searchButton, addEventListener("click"), () => {
    checkData(searchBox.value);
}

checkData();                        


async function fetchCountryDataSearch(countryName) {
    const apiUrl = "https://restcountries.com/v3.1/name/";
    try {
        const response = await fetch(`${apiURL}${countryName}?fields=name,flags`);
        if (!response.ok) throw new Error('Country not found');
        let data = await response.json();


    }
}

<div class="weather-popup" style="position: absolute; top: 10px; right: 10px; background: white; padding: 10px; display: none;">
  <h3>Météo</h3>
  <p id="weather-data"></p>
</div>

async function fetchWeatherData(countryName) {
    const apiKey = '62fa436d5950ece867f81767b004ca78'; // Remplace par ta clé API OpenWeatherMap
    const apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${countryName}&appid=${apiKey}&units=metric`;
    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error('Weather data not found');
      let data = await response.json();
      const weatherDescription = data.weather[0].description;
      const temperature = data.main.temp;
      return `Description: ${weatherDescription}, Temperature: ${temperature}°C`;
    } catch (error) {
      return `Error fetching weather data: ${error.message}`;
    }
  }
  
  // Fetch weather data
  const weatherData = await fetchWeatherData(countryName);
  document.getElementById('weather-data').innerText = weatherData;
  document.querySelector('.weather-popup').style.display = 'block';
} catch (error) {
  infoPopupEl.innerHTML = `<p>${error.message}</p>`;
  infoPopupEl.style.display = 'block';
}





async function fetchCountryData(countryName) {
    const apiURL = "https://restcountries.com/v3.1/name/";
    try {
        const response = await fetch(`${apiURL}${countryName}?fields=name,flags,capital,currencies,maps`);
        if (!response.ok) throw new Error('Country not found');
        let data = await response.json();

        const country = data[0];
        const currencyName = Object.values(country.currencies)[0].name;
        const currencySymbol = Object.values(country.currencies)[0].symbol;
        const capital = country.capital[0];
        const googleMapsLink = country.maps.googleMaps;
        const openStreetMapsLink = country.maps.openStreetMaps;

        infoPopupEl.innerHTML = `
            <h2>${country.name.common}</h2>
            <h3>${country.name.official}</h3>
            <p>Capital: ${capital}</p>
            <p>Currency: ${currencyName} (${currencySymbol})</p>
            <img src="${country.flags.svg}" alt="${country.name.common} Flag">
            <p><strong>Maps:</strong> <a href="${googleMapsLink}" target="_blank">Google Maps</a>, <a href="${openStreetMapsLink}" target="_blank">OpenStreetMaps</a></p>
        `;
        infoPopupEl.style.display = 'block';
    } catch (error) {
        infoPopupEl.innerHTML = `<p>${error.message}</p>`;
        infoPopupEl.style.display = 'block';
    }
}

// Barre de recherche
const searchInput = document.querySelector("input[placeholder='On va où ?']");
searchInput.addEventListener("keypress", function (e) {
    if (e.key === 'Enter') {
        fetchCountryData(searchInput.value);
    }
});

@keyframes float {
    0% {
        box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
        transform: translatey(0px);
    }
    50% {
        box-shadow: 0 25px 15px 0px rgba(0, 0, 0, 0.2);
        transform: translatey(-20px);
    }
    100% {
        box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
        transform: translatey(0px);
    }
}

body {
    background-color: #e9eff4;
    font-family: Arial, sans-serif;
}

.info-popup, .weather-popup {
    position: absolute;
    background: #f0f4f8;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
    transform: translatey(0px);
    animation: float 4s ease-in-out infinite;
    max-width: 300px;
    overflow-y: auto;
    color: #333;
    border: 2px solid #0066cc;
}

.info-popup h2, .weather-popup h2 {
    color: #0066cc;
    margin-top: 0;
}

.info-popup img, .weather-popup img {
    max-width: 100%;
    height: auto;
    border-radius: 5px;
}

.info-popup p, .weather-popup p {
    margin: 5px 0;
}

.info-popup a, .weather-popup a {
    color: #0066cc;
    text-decoration: none;
}

.info-popup {
    top: 50px;
    left: 10px;
}

.weather-popup {
    top: 10px;
    right: 10px;
    max-width: 200px;
    max-height: 150px;
    display: none;
}

.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}





async function fetchMapData(countryName) {
    
    const apiURL = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat`
    const apiKey = `8fbe03b1252043f3b6083ab4cc40ef85`;
    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error('Map data not found');
      let data = await response.json();
      const mapVisible = data.weather[0].description;
      return 
    } catch (error) {
      return `Error fetching map data: ${error.message}`;
    }
  }

  `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:-122.304507,47.52437&zoom=14&apiKey=8fbe03b1252043f3b6083ab4cc40ef85`


  // // Récupère les données de la carte pour un pays donné
async function fetchMapData(countryName) {
    const apiKey = '8fbe03b1252043f3b6083ab4cc40ef85';
    const geoAPIURL = `https://maps.geoapify.com/v1/geocode/search?text=${countryName}&apiKey=${apiKey}`;
    const mapAPIURL = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&marker=lonlat`;

    try {
        const response = await fetch(geoAPIURL);
        if (!response.ok) throw new Error('Geolocation data not found');
        const geoData = await response.json();

        const { lon, lat } = geoData.features[0].properties;
        const mapURL = `${mapAPIURL}&center=${lon},${lat}&zoom=5&apiKey=${apiKey}`;
        
        return mapURL;
    } catch (error) {
        return `Error fetching map data: ${error.message}`;
    }
}


// pour fetchCountrydata
const mapURL = await fetchMapData(countryName);

<img src="${mapURL}" alt="Map of ${countryName}"></img>



//Tiph appel 

let languageText = "";

        if (!country.languages || Object.keys(country.languages).length === 0) {
          languageText = "No languages found";
        } else if (Object.keys(country.languages).length === 1) {
          languageText = Language: ${Object.values(country.languages)[0]};
        } else {
          const languages = Object.values(country.languages);
          for (let i = 0; i < languages.length; i++) {
            languageText += ${languages[i]};
            if (i !== languages.length - 1) {
              languageText += ", ";
            }
          }
        }
        