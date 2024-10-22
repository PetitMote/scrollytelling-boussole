/* Paramètres globaux pour ChartJS*/

Chart.defaults.locale = 'fr-FR';
/* À cause des réglages du CSS, le navigateur a tendance à redimensionner le canvas du graphique.
   Par défaut, Chart.js désactive les animations de resize, et l’animation d’activation était supplantée par le resize
   Changer le paramètre par défaut pour mettre la même valeur que l’activation permet de la récupérer.
   Par contre, cela veut dire que redimensionner la fenêtre relance l’animation (normalement, c’est ok). */
Chart.defaults.transitions.resize.animation.duration = Chart.defaults.transitions.active.animation.duration;
// Permet d’avoir des graphiques plus responsives
// Voir https://www.chartjs.org/docs/latest/configuration/responsive.html
Chart.defaults.maintainAspectRatio = false;
// Utilisation des couleurs Auran
Chart.defaults.plugins.colors.enabled = false;
Chart.register(aurancolors);
// Polices
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.font.weight = 300;
Chart.defaults.font.size = 14;


/*
Les registres sont des objets qui vont être remplies par le code Javascript afin de suivre l’état de la page.
Par exemple, suivre quelles illustrations sont actuellement affichées pour savoir s’il faut la remplacer par une
nouvelle illustration ou conserver l’existante.
Cela permet également de sauvegarder une référence vers les éléments dynamiques des bibliothèques Javascript
(graphiques et cartes interactives), qui nécessitent d’être détruits par des fonctions spécifiques pour vider la mémoire
du navigateur des éléments qui sont chargés.
Par exemple, un graphique nécessite d’être nettoyée avec la méthode .destroy() pour que ChartJS "oublie" complètement
l’élément.
 */
// Registre des figures, pour vérifier ce qui est déjà affiché
let figureRegistry = {};
// Registre des graphiques ChartJS pour suppression
let chartRegistry = {};
// Registre des cartes interactives Leaflet pour interaction / suppression
let mapRegistry = {};


document.addEventListener('scroll-scene-enter', (event) => {
    /*
    Réaction à l’arrivée d’un nouvel évènement de scroll
     */
    // Ajout de la classe CSS de l’élément actif (par exemple pour gérer l’opacité)
    event.detail.element.classList.add('is-active');
    // Récupération des informations d’animation de scroll à appliquer
    let scrollData = {};
    for (let attribute of event.detail.element.attributes) {
        if (attribute.name.startsWith('scroll'))
            scrollData[attribute.name] = attribute.value;
    }
    scrollEvent(scrollData);
});
document.addEventListener('scroll-scene-exit', (event) => {
    // Lorsqu’on quitte un élément de scroll, on lui retire la classe CSS d’élément actif
    event.detail.element.classList.remove('is-active');
});

function scrollEvent(scrollData) {
    /*
    Lance les hooks, s’il y en a, et entre les deux charge l’évènement principal
     */
    if (scrollData['scroll-pre-hook']) runHook(scrollData['scroll-pre-hook']);
    if (scrollData['scroll-type']) scrollFigure(scrollData);
    if (scrollData['scroll-post-hook']) runHook(scrollData['scroll-post-hook']);
}

function runHook(hookName) {
    /*
    Va chercher une fonction hook par son nom et l’exécute.
     */
    hooks[hookName]();
}

function scrollFigure(scrollData) {
    /*
    Vérifie, à partir des informations d’un évènement de scroll, s’il faut faire un changement d’illustration.
    Si c’est le cas, il appelle la fonction correspondant au type d’évènement de scroll (image, graphique, carte)
    Si ce n’est pas le cas, il peut quand même appeler une fonction particulière sur une illustration existante (pour
    l’instant, cela ne concerne que les cartes pour modifier la vue / le zoom).
     */
    const figureRegistryString = buildFigureRegistryString(scrollData);
    if (!checkFigureRegistryString(scrollData['scroll-figure'], figureRegistryString)) {
        cleanFigureIfNeeded(scrollData['scroll-figure']);
        switch (scrollData['scroll-type']) {
            case 'img':
                scrollImg(scrollData);
                break;
            case 'chart':
                scrollChart(scrollData);
                break;
            case 'map':
                scrollMap(scrollData);
                break;
        }
        registerFigureRegistryString(scrollData['scroll-figure'], figureRegistryString);
    } else {
        switch (scrollData['scroll-type']) {
            case 'map':
                scrollExistingMap(scrollData);
                break;
        }
    }
}

function buildFigureRegistryString(scrollData) {
    /*
    Construit la chaîne de caractères qui sera enregistrée dans le registre des figures
     */
    switch (scrollData['scroll-type']) {
        case 'img':
            return 'img-' + scrollData['scroll-img-link'];
        case 'chart':
            return 'chart-' + scrollData['scroll-chart-name'];
        case 'map':
            return 'map-' + scrollData['scroll-map-name'];
    }
}

function checkFigureRegistryString(figureId, figureString) {
    /*
    Compare une chaîne de caractère à celle déjà existante dans le registre
     */
    return figureRegistry[figureId] === figureString;
}

function registerFigureRegistryString(figureId, figureString) {
    /*
    Enregistre une chaîne de caractères dans le registre des figures
     */
    figureRegistry[figureId] = figureString;
}

function cleanFigureIfNeeded(figureId, newFigureString) {
    /*
    Compare la nouvelle figure à l’ancienne grâce au registre des figures
    Si nécessaire, "nettoie" les illustrations qui ont besoin d’une fonction particulière pour être correctement
    supprimées de la mémoire (graphiques et cartes interactives).
     */
    const existingFigureString = figureRegistry[figureId];
    if (existingFigureString) {
        if (existingFigureString.startsWith('chart')) {
            // Si la figure existante est un graphique
            const existingChartName = existingFigureString.substring(6);
            chartRegistry[existingChartName].destroy();
            delete chartRegistry[existingChartName];
        } else if (existingFigureString.startsWith('map')) {
            // Si la figure existante est une carte
            const existingMapName = existingFigureString.substring(4);
            if (newFigureString.startsWith('map')) {
                // Si la nouvelle figure est également une carte
            } else {
                // Si la nouvelle figure n’est pas une carte
                mapRegistry[existingMapName].remove();
                delete mapRegistry[existingMapName];
            }
        }
    }
}

function scrollImg(scrollData) {
    /*
    Change une illustration par une image.
    Récupère le lien et l’alt de l’image dans les informations de l’évènement de scroll.
     */
    const element = document.getElementById(scrollData['scroll-figure']);
    element.innerHTML = '<img src="' + scrollData['scroll-img-link'] + '" alt="' + scrollData['scroll-img-alt'] + '">';
}

function scrollChart(scrollData) {
    /*
    Change une illustration par un graphique.
    Récupère les informations à partir des dictionnaires de graphiques et du nom de graphique donné par l’évènement de
    scroll.
     */
    // Préparation du HTML
    const figureId = scrollData['scroll-figure'];
    const canvasId = figureId + '-chart';
    const element = document.getElementById(figureId);
    element.innerHTML = '<div class="chart"><canvas id="' + canvasId + '"></canvas></div>';

    // Création du graphique
    createChart(canvasId, scrollData['scroll-chart-name']);
}

function scrollMap(scrollData) {
    /*
    Change une illustration par une carte interactive.
     */
    // Préparation des éléments à partir des informations des évènements de scroll
    const figureId = scrollData['scroll-figure'];
    const divId = figureId + '-map';
    const mapName = scrollData['scroll-map-name'];

    // Récupération de l’information de la figure existante
    const existingFigureString = figureRegistry[figureId];
    if (existingFigureString && existingFigureString.startsWith('map')) {
        // Si la figure existante est déjà une carte, plutôt que d’en créer une nouvelle
        // on la vide
        const existingMapName = existingFigureString.substring(4);
        removeLayersFromMap(existingMapName);
    } else {
        // Sinon création d’une nouvelle carte
        const element = document.getElementById(figureId);
        element.innerHTML = '<div id="' + divId + '" style="height: 100%; width: 100%"></div>';
        createMap(divId, mapName);
    }
    // On ajoute les couches à la carte
    addLayersToMap(mapName);
    // On définit le point de vue de la carte
    setViewMapFromScroll(scrollData);
}

function scrollExistingMap(scrollData) {
    /*
    Actions à effectuer si le scroll concerne une carte déjà présente.
    Le but est d’effectuer des actions qui ne nécessitent pas une nouvelle carte et qui peuvent être données dans les
    informations de l’évènement de scroll.
    Actuellement, cela concerne uniquement le déplacement sur la carte.
     */
    setViewMapFromScroll(scrollData);
}


function createChart(canvasId, chartName) {
    /*
    Cette fonction crée de manière autonome un graphique à partir des configurations données.
    Elle va chercher l’élément canvas correspondant à l’id pour héberger le graphique.
    Le nom de graphique permet :
    - D’aller chercher la configuration du graphique (type de graphique, titre, etc.)
    - D’aller chercher les données du graphique
    - D’enregistrer le graphique dans le registre
     */
    // Récupération des informations
    const canvas = document.getElementById(canvasId);
    const chartConfiguration = chartsConfigurations[chartName];
    const chartData = data[chartName];

    // Récupération des labels et des séries de données
    let labels = [];
    let series = {};
    for (let row of chartData) {
        labels.push(row.label);
        for (let column in row) {
            if (column === 'label')
                continue;
            if (!series[column])
                series[column] = [row[column]];
            else
                series[column].push(row[column]);

        }
    }

    // Préparation des séries de données au format ChartJS
    let datasets = [];
    for (let serie in series) {
        datasets.push({
            label: serie,
            data: series[serie],
        });
    }

    // Préparation de l’objet de configuration ChartJS
    let chartParameters = {
        type: chartConfiguration.type,
        data: {
            labels: labels,
            datasets: datasets,
        },
        options: {
            plugins: {
                title: {
                    display: (chartConfiguration.title !== null),
                    text: chartConfiguration.title,
                },
                legend: {
                    display: chartConfiguration.legend,
                }
            }
        }
    };

    // Création du graphique et enregistrement dans le registre des graphiques
    chartRegistry[chartName] = new Chart(canvas, chartParameters);
}


function createMap(containerId, mapName) {
    /*
    Crée une carte à partir de l’ID de son container. Enregistre la carte dans le registre des cartes.
     */
    const mapContainer = document.getElementById(containerId);
    mapRegistry[mapName] = L.map(mapContainer, {preferCanvas: true});
}

async function addLayersToMap(mapName) {
    /*
    Ajoute les couches mentionnées dans la configuration de la carte.
     */
    // Récupère la référence de la carte
    const map = mapRegistry[mapName];
    // Récupère la configuration de la carte
    const mapConfig = mapConfigurations[mapName];
    // Récupère les couches, et les ajoute. Code asynchrone nécessaire pour les couches en GeoJSON
    const layers = await mapConfig.layers;
    for (let layer of layers) {
        (await layer).addTo(map);
    }
}

function removeLayersFromMap(mapName) {
    /*
    Retire toutes les couches d’une carte interactive
     */
    const map = mapRegistry[mapName];
    map.eachLayer((layer) => {
        map.removeLayer(layer)
    });
}

function setViewMap(mapName, coordinates, zoom) {
    /*
    Modifie le pointe de vue d’une couche.
    Coordonnées au format WGS84 (latitude, longitude)
     */
    const map = mapRegistry[mapName];
    map.setView(coordinates, zoom);
}

function setViewMapFromScroll(scrollData) {
    /*
    Déplace la vue d’une carte à partir des coordonnées contenues dans les infos de l’évènement de scroll, ou à partir
    des coordonnées par défaut.
     */
    const mapName = scrollData['scroll-map-name'];

    // Récupère les coordonnées depuis le scroll, et les formate au format Leaflet ([latitude, longitude])
    let coordinates = scrollData['scroll-map-coordinates'];
    if (coordinates) coordinates = coordinates.split(',').map(Number);
    // Sinon utilise les coordonnées par défaut
    else coordinates = mapConfigurations[mapName].coordinates;

    // Fait de même pour le zoom
    let zoom = scrollData['scroll-map-zoom'];
    if (zoom) zoom = Number(zoom);
    else zoom = mapConfigurations[mapName].zoom;

    setViewMap(mapName, coordinates, zoom);
}

async function geoJsonToLayer(geoJson, options) {
    /*
    Fonction asynchrone pour créer une couche Leaflet à partir :
    - D’un fichier GeoJSON à récupérer par requête
    - De ses options au format objet défini par Leaflet
     */
    const response = await fetch(geoJson);
    const data = await response.json();
    return L.geoJson(data, options);
}


