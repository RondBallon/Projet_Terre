// Importation des bibliothèques nécessaires
import * as THREE from "three";  // Bibliothèque principale Three.js pour la 3D
import { OrbitControls } from "three/addons/controls/OrbitControls.js";  // Contrôles de caméra
import { GUI } from "https://cdn.skypack.dev/lil-gui@0.17.0";  // Interface utilisateur pour le debug

// Sélection des éléments du DOM
const containerEl = document.querySelector(".globe-wrapper");  // Conteneur principal du globe
const canvasEl = containerEl.querySelector("#globe-3d");  // Canvas pour le rendu 3D
const svgMapDomEl = document.querySelector("#map");  // SVG contenant la carte du monde
const svgCountries = Array.from(svgMapDomEl.querySelectorAll("path"));  // Liste des pays du SVG
const svgCountryDomEl = document.querySelector("#country");  // Template pour un pays
const countryNameEl = document.querySelector(".info span");  // Affichage du nom du pays
const infoPopupEl = document.querySelector(".info-popup");  // Popup d'informations du pays
const placeholderInput = document.querySelector('input[placeholder="On va où ?"]');  // Barre de recherche
const weatherPopupEl = document.querySelector(".weather-popup");  // Popup météo

// Variables globales pour Three.js
let renderer, scene, camera, rayCaster, pointer, controls;
let globeGroup, globeColorMesh, globeStrokesMesh, globeSelectionOuterMesh;

// Configuration de la vue SVG
const svgViewBox = [2000, 1000];  // Dimensions du viewBox SVG
const offsetY = -.1;  // Décalage vertical pour centrer la carte

// Paramètres de configuration
const params = {
    strokeColor: "#111111",      // Couleur des contours des pays
    defaultColor: "#9a9591",     // Couleur par défaut des pays
    hoverColor: "#00C9A2",       // Couleur au survol d'un pays
    fogColor: "#e4e5e6",         // Couleur du brouillard
    fogDistance: 2.6,            // Distance du brouillard
    strokeWidth: 2,              // Épaisseur des contours
    hiResScalingFactor: 2,       // Facteur d'échelle haute résolution
    lowResScalingFactor: .7      // Facteur d'échelle basse résolution
}

// Variables d'état
let hoveredCountryIdx = 6;  // Index du pays survolé
let isTouchScreen = false;  // Détection d'écran tactile
let isHoverable = true;     // Si le survol est actif

// Chargeur de textures
const textureLoader = new THREE.TextureLoader();
let staticMapUri;  // URI de la carte statique
const bBoxes = [];  // Boîtes englobantes des pays
const dataUris = [];  // URIs des données des pays

// Initialisation
initScene();  // Initialise la scène Three.js
createControls();  // Crée les contrôles de l'interface
window.addEventListener("resize", updateSize);  // Gestion du redimensionnement

// Écouteurs d'événements pour l'interaction
containerEl.addEventListener("touchstart", () => { isTouchScreen = true; });
containerEl.addEventListener("mousemove", (e) => { updateMousePosition(e.clientX, e.clientY); });
containerEl.addEventListener("click", (e) => {
    updateMousePosition(e.clientX, e.clientY);
    fetchCountryData(svgCountries[hoveredCountryIdx].getAttribute("data-name"));
});

// Met à jour la position de la souris pour le raycasting
function updateMousePosition(eX, eY) {
    pointer.x = (eX - containerEl.offsetLeft) / containerEl.offsetWidth * 2 - 1;
    pointer.y = -((eY - containerEl.offsetTop) / containerEl.offsetHeight) * 2 + 1;
}

// Initialise la scène Three.js
function initScene() {
    // Configuration du renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Création de la scène et du brouillard
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(params.fogColor, 0, params.fogDistance);

    // Configuration de la caméra orthographique
    camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0, 3);
    camera.position.z = 1.3;

    // Création du groupe pour le globe
    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Configuration du raycaster pour la détection de survol
    rayCaster = new THREE.Raycaster();
    rayCaster.far = 1.15;
    pointer = new THREE.Vector2(-1, -1);

    // Initialisation des composants
    createOrbitControls();
    createGlobe();
    prepareHiResTextures();
    prepareLowResTextures();
    updateSize();

    // Démarrage de la boucle de rendu
    gsap.ticker.add(render);
}

// Crée les contrôles de caméra
function createOrbitControls() {
    controls = new OrbitControls(camera, canvasEl);
    controls.enablePan = false;  // Désactive le déplacement latéral
    controls.enableDamping = true;  // Active l'inertie
    controls.minPolarAngle = .46 * Math.PI;  // Limite l'angle vertical minimum
    controls.maxPolarAngle = .46 * Math.PI;  // Limite l'angle vertical maximum
    controls.autoRotate = true;  // Active la rotation automatique
    controls.autoRotateSpeed *= 1.2;  // Vitesse de rotation

    // Animation lors du début du contrôle
    controls.addEventListener("start", () => {
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

    // Animation lors de la fin du contrôle
    controls.addEventListener("end", () => {
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

// Crée le globe 3D
function createGlobe() {
    const globeGeometry = new THREE.IcosahedronGeometry(1, 20);

    // Matériaux pour les différentes couches du globe
    const globeColorMaterial = new THREE.MeshBasicMaterial({
        color: 0x0000ff,  // Couleur bleue pour les océans
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

    // Création des maillages
    globeColorMesh = new THREE.Mesh(globeGeometry, globeColorMaterial);
    globeStrokesMesh = new THREE.Mesh(globeGeometry, globeStrokeMaterial);
    globeSelectionOuterMesh = new THREE.Mesh(globeGeometry, outerSelectionColorMaterial);

    globeStrokesMesh.renderOrder = 2;  // Assure que les contours sont rendus en dernier

    // Ajout des maillages au groupe
    globeGroup.add(globeStrokesMesh, globeSelectionOuterMesh, globeColorMesh);
}

// Charge une texture sur un matériau
function setMapTexture(material, URI) {
    textureLoader.load(
        URI,
        (t) => {
            t.repeat.set(1, 1);
            material.map = t;
            material.needsUpdate = true;
        });
}

// Prépare les textures haute résolution
function prepareHiResTextures() {
    let svgData;
    // Configuration du SVG pour la texture principale
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

    // Configuration du SVG pour les contours
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

// Prépare les textures basse résolution pour la sélection
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
    // Calcule les boîtes englobantes pour chaque pays
    svgCountries.forEach((path, idx) => {
        bBoxes[idx] = path.getBBox();
    });
    // Crée les URIs de données pour chaque pays
    svgCountries.forEach((path, idx) => {
        svgCountryDomEl.innerHTML = "";
        svgCountryDomEl.appendChild(svgCountries[idx].cloneNode(true));
        const svgData = new XMLSerializer().serializeToString(svgCountryDomEl);
        dataUris[idx] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    });
    setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);
}

// Récupère les données météo d'un pays
async function fetchWeatherData(countryName) {
    const apiKey = '62fa436d5950ece867f81767b004ca78';
    try {
        // Appel à l'API OpenWeatherMap
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${countryName}&appid=${apiKey}&units=metric&lang=fr`);
        if (!response.ok) throw new Error('Weather data not found');
        
        const data = await response.json();
        // Création du HTML pour afficher la météo
        const weatherHTML = `
            <div id="weather-data">
                <h3>Météo à ${data.name}</h3>
                <p>
                    <strong>Température:</strong> ${Math.round(data.main.temp)}°C<br>
                    <strong>Description:</strong> ${data.weather[0].description}<br>
                    <strong>Humidité:</strong> ${data.main.humidity}%
                </p>
            </div>
        `;
        return weatherHTML;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return `<div id="weather-data"><p class="error">Erreur météo: ${error.message}</p></div>`;
    }
}

// Récupère les informations d'un pays
async function fetchCountryData(countryName) {
    const apiURL = "https://restcountries.com/v3.1/name/";
    try {
        // Appel à l'API RestCountries
        const response = await fetch(`${apiURL}${countryName}?fields=name,flags,capital,currencies`);
        if (!response.ok) throw new Error('Country not found');

        let data = await response.json();
        const country = data[0];
        const currencyName = Object.values(country.currencies)[0].name;
        const currencySymbol = Object.values(country.currencies)[0].symbol;
        const capital = country.capital[0];

        // Affichage des informations du pays
        infoPopupEl.innerHTML = `
            <h2>${country.name.common}</h2>
            <h3>${country.name.official}</h3>
            <p>Capital: ${capital}</p>
            <p>Currency: ${currencyName} (${currencySymbol})</p>
            <img src="${country.flags.svg}" alt="${country.name.common} Flag">
        `;
        infoPopupEl.style.display = 'block';

        // Récupération et affichage de la météo
        const weatherHTML = await fetchWeatherData(countryName);
        weatherPopupEl.innerHTML = weatherHTML;
        weatherPopupEl.style.display = 'block';
    } catch (error) {
        console.error('Error fetching country data:', error);
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

// Fonction de rendu
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

// Met à jour la carte en fonction de la position de la souris
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

// Met à jour la taille du canvas en fonction de la fenêtre
function updateSize() {
    const side = Math.min(500, Math.min(window.innerWidth, window.innerHeight) - 50);
    containerEl.style.width = side + "px";
    containerEl.style.height = side + "px";
    renderer.setSize(side, side);
}

// Crée les contrôles de l'interface utilisateur
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
