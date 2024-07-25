import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/lil-gui@0.17.0";

const containerEl = document.querySelector(".globe-wrapper");
const canvasEl = containerEl.querySelector("#globe-3d");
const svgMapDomEl = document.querySelector("#map");
const svgCountries = Array.from(svgMapDomEl.querySelectorAll("path"));
const svgCountryDomEl = document.querySelector("#country");
const countryNameEl = document.querySelector(".info span");
const infoPopupEl = document.querySelector(".info-popup");
const placeholderInput = document.querySelector('input[placeholder="On va où ?"]');
const weatherPopupEl = document.querySelector(".weather-popup");
const mapPopupEl = document.querySelector('.map-popup');

let renderer, scene, camera, rayCaster, pointer, controls;
let globeGroup, globeColorMesh, globeStrokesMesh, globeSelectionOuterMesh;

const svgViewBox = [2000, 1000];
const offsetY = -.1;

const params = {
    strokeColor: "#111111",
    defaultColor: "#9a9591",
    hoverColor: "#00C9A2",
    fogColor: "#e4e5e6",
    fogDistance: 2.6,
    strokeWidth: 2,
    hiResScalingFactor: 2,
    lowResScalingFactor: .7
}

let hoveredCountryIdx = 6;
let isTouchScreen = false;
let isHoverable = true;

const textureLoader = new THREE.TextureLoader();
let staticMapUri;
const bBoxes = [];
const dataUris = [];


initScene();
createControls();
window.addEventListener("resize", updateSize);

containerEl.addEventListener("touchstart", () => { isTouchScreen = true; });
containerEl.addEventListener("mousemove", (e) => { updateMousePosition(e.clientX, e.clientY); });
containerEl.addEventListener("click", (e) => {
    updateMousePosition(e.clientX, e.clientY);
    fetchCountryData(svgCountries[hoveredCountryIdx].getAttribute("data-name"));
});

function updateMousePosition(eX, eY) {
    pointer.x = (eX - containerEl.offsetLeft) / containerEl.offsetWidth * 2 - 1;
    pointer.y = -((eY - containerEl.offsetTop) / containerEl.offsetHeight) * 2 + 1;
}

// Initialisation de la scène 3D avec Three.js
function initScene() {
    // Création du renderer WebGL
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Création de la scène
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(params.fogColor, 0, params.fogDistance);

    // Création de la caméra
    camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0, 3);
    camera.position.z = 1.3;

    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    rayCaster = new THREE.Raycaster();
    rayCaster.far = 1.15;
    pointer = new THREE.Vector2(-1, -1);

// contrôles orbitaux
createOrbitControls();
// création du globe terrestre
createGlobe();
// textures haute résolution
prepareHiResTextures();
// textures basse résolution
prepareLowResTextures();
// Mise à jour de la taille du renderer/globe 
updateSize();

    // Ajout du render à la boucle d'animation > on retrouve plus bas pour MAJ Frame
    gsap.ticker.add(render);
}

// Création des contrôles pour la caméra
function createOrbitControls() {
    controls = new OrbitControls(camera, canvasEl);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minPolarAngle = .46 * Math.PI;
    controls.maxPolarAngle = .46 * Math.PI;
    controls.autoRotate = true;
    controls.autoRotateSpeed *= 1.2;

    // Événements de click/click relaché + arrêt
    controls.addEventListener("start", () => {
        console.log("clic enclenché");
        isHoverable = false;
        pointer = new THREE.Vector2(-1, -1);
        gsap.to(globeGroup.scale, {
            duration: .3,
            x: .9,
            y: .9,
            z: .9,
            ease: "power1.inOut"
        });
    });

    controls.addEventListener("end", () => {
        console.log("clic relâché");
        gsap.to(globeGroup.scale, {
            duration: .6,
            x: 1,
            y: 1,
            z: 1,
            ease: "back(1.7).out",
            onComplete: () => { isHoverable = true; }
        });
    });
}

// Création du globe terrestre
function createGlobe() {
    const globeGeometry = new THREE.IcosahedronGeometry(1, 20);

    const globeColorMaterial = new THREE.MeshBasicMaterial({
        color: 0x092FF0, // Couleur bleue pour les zones d'eau
        side: THREE.DoubleSide
    });
    const globeStrokeMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
    });
    const outerSelectionColorMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        side: THREE.DoubleSide
    });

     // Création des meshes pour le globe
    globeColorMesh = new THREE.Mesh(globeGeometry, globeColorMaterial);
    globeStrokesMesh = new THREE.Mesh(globeGeometry, globeStrokeMaterial);
    globeSelectionOuterMesh = new THREE.Mesh(globeGeometry, outerSelectionColorMaterial);

    globeStrokesMesh.renderOrder = 2;

    globeGroup.add(globeStrokesMesh, globeSelectionOuterMesh, globeColorMesh);
}

// Mise à jour de la texture de la carte
function setMapTexture(material, URI) {
    textureLoader.load(
        URI,
        (t) => {
            t.repeat.set(1, 1);
            material.map = t;
            material.needsUpdate = true;
        });
}

// textures haute résolution
function prepareHiResTextures() {
    let svgData;
    gsap.set(svgMapDomEl, {
        attr: {
            "viewBox": "0 " + (offsetY * svgViewBox[1]) + " " + svgViewBox[0] + " " + svgViewBox[1],
            "stroke-width": params.strokeWidth,
            "stroke": params.strokeColor,
            "fill": params.defaultColor,
            "width": svgViewBox[0] * params.hiResScalingFactor,
            "height": svgViewBox[1] * params.hiResScalingFactor,
        }
    });
    svgData = new XMLSerializer().serializeToString(svgMapDomEl);
    staticMapUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    setMapTexture(globeColorMesh.material, staticMapUri);

   // AFFICHE LES NOMS DES TERTER
    gsap.set(svgMapDomEl, {
        attr: {
            "fill": "none",
            "stroke": params.strokeColor,
        }
    });
    svgData = new XMLSerializer().serializeToString(svgMapDomEl);
    staticMapUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    setMapTexture(globeStrokesMesh.material, staticMapUri);
    countryNameEl.innerHTML = svgCountries[hoveredCountryIdx].getAttribute("data-name");
}

// textures basse résolution
function prepareLowResTextures() {
    gsap.set(svgCountryDomEl, {
        attr: {
            "viewBox": "0 " + (offsetY * svgViewBox[1]) + " " + svgViewBox[0] + " " + svgViewBox[1],
            "stroke-width": params.strokeWidth,
            "stroke": params.strokeColor,
            "fill": params.hoverColor,
            "width": svgViewBox[0] * params.lowResScalingFactor,
            "height": svgViewBox[1] * params.lowResScalingFactor,
        }
    });
    svgCountries.forEach((path, idx) => {
        bBoxes[idx] = path.getBBox();
    });
    svgCountries.forEach((path, idx) => {
        svgCountryDomEl.innerHTML = "";
        svgCountryDomEl.appendChild(svgCountries[idx].cloneNode(true));
        const svgData = new XMLSerializer().serializeToString(svgCountryDomEl);
        dataUris[idx] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    });
    setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);
}

// Mise à jour de la carte en fonction de la position
function updateMap(uv = { x: 0, y: 0 }) {
    const pointObj = svgMapDomEl.createSVGPoint();
    pointObj.x = uv.x * svgViewBox[0];
    pointObj.y = (1 + offsetY - uv.y) * svgViewBox[1];

    for (let i = 0; i < svgCountries.length; i++) {
        const boundingBox = bBoxes[i];
        if (
            pointObj.x > boundingBox.x ||
            pointObj.x < boundingBox.x + boundingBox.width ||
            pointObj.y > boundingBox.y ||
            pointObj.y < boundingBox.y + boundingBox.height
        ) {
            const isHovering = svgCountries[i].isPointInFill(pointObj);
            if (isHovering) {
                if (i !== hoveredCountryIdx) {
                    hoveredCountryIdx = i;
                    setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);
                    countryNameEl.innerHTML = svgCountries[hoveredCountryIdx].getAttribute("data-name");
                    break;
                }
            }
        }
    }
}

// Appel du render pour chaque frame 
function render() {
    controls.update();

    if (isHoverable) {
        rayCaster.setFromCamera(pointer, camera);
        const intersects = rayCaster.intersectObject(globeStrokesMesh);
        if (intersects.length) {
            updateMap(intersects[0].uv);
        }
    }

    if (isTouchScreen && isHoverable) {
        isHoverable = false;
    }

    renderer.render(scene, camera);
}

// Function pour le scaling -
function updateSize() {
    const side = Math.min(500, Math.min(window.innerWidth, window.innerHeight) - 50);
    containerEl.style.width = side + "px";
    containerEl.style.height = side + "px";
    renderer.setSize(side, side);
}

// Function pour créer les controles IU
function createControls() {
    const gui = new GUI();
    gui.close();

    gui.addColor(params, "strokeColor")
        .onChange(prepareHiResTextures)
        .name("stroke");
    gui.addColor(params, "defaultColor")
        .onChange(prepareHiResTextures)
        .name("color");
    gui.addColor(params, "hoverColor")
        .onChange(prepareLowResTextures)
        .name("highlight");
    gui.addColor(params, "fogColor")
        .onChange(() => {
            scene.fog = new THREE.Fog(params.fogColor, 0, params.fogDistance);
        })
        .name("fog");
    gui.add(params, "fogDistance", 1, 4)
        .onChange(() => {
            scene.fog = new THREE.Fog(params.fogColor, 0, params.fogDistance);
        })
        .name("fog distance");
}

async function fetchMapData(countryName) {
    const apiKey = '8fbe03b1252043f3b6083ab4cc40ef85';
    const geoAPIURL = `https://api.geoapify.com/v1/geocode/search?text=${countryName}&apiKey=${apiKey}`;

    try {
        const response = await fetch(geoAPIURL);
        if (!response.ok) throw new Error('Geolocation data not found');
        const geoData = await response.json();

        const { lon, lat } = geoData.features[0].properties;
        const mapURL = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${lon},${lat}&zoom=5&apiKey=${apiKey}`;
        return mapURL;    
    } catch (error) {
        return `Error fetching map data: ${error.message}`;
    }
}


// Fonction d'appel de l'API en amont de celle de Country API \\

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

// La boss \\

async function fetchCountryData(countryName) {
    const apiURL = "https://restcountries.com/v3.1/name/";
    try {
      const response = await fetch(`${apiURL}${countryName}?fields=name,flags,capital,currencies,maps,languages`);
      if (!response.ok) throw new Error('Country not found');
      let data = await response.json();
  
      const country = data[0];
      const currencyName = Object.values(country.currencies)[0].name;
      const currencySymbol = Object.values(country.currencies)[0].symbol;
      const capital = country.capital[0];
      const googleMapsLink = country.maps.googleMaps;
      const openStreetMapsLink = country.maps.openStreetMaps;
      const languageText = Object.values(country.languages);
      const mapURL = await fetchMapData(countryName);
     
      
      infoPopupEl.innerHTML = `
        <h2>${country.name.common}</h2>
        <h3>${country.name.official}</h3>
        <p>Capital: ${capital}</p>
        <p>Currency: ${currencyName} (${currencySymbol})</p>
        <p>${languageText}</p>
        <img src="${country.flags.svg}" alt="${country.name.common} Flag">
        <p><strong>Maps:</strong> <a href="${googleMapsLink}" target="_blank">Google Maps</a>, <a href="${openStreetMapsLink}" target="_blank">OpenStreetMaps</a></p>
      `;
      infoPopupEl.style.display = 'block';
      
      if (mapURL) {
        mapPopupEl.innerHTML = `
            <img src="${mapURL}" alt="Map of ${countryName}">
        `;
        mapPopupEl.style.display = 'block';
    } else {
        mapPopupEl.innerHTML = '<p>Unable to load map data</p>';
        mapPopupEl.style.display = 'block';
    }
  
      // API Weather krkrkrkrk 
      
      const weatherData = await fetchWeatherData(countryName);
      document.getElementById('weather-data').innerText = weatherData;
      document.querySelector('.weather-popup').style.display = 'block';
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
  



