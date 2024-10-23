/* Constantes */


/*
La donnée est chargée avec en tête les exports de PostgreSQL :
- Un objet, avec comme clés les noms des datasets
- La valeur de chacun est une liste de toutes les lignes
- Une ligne est un objet, les clés étant les noms des colonnes
- Il doit obligatoirement y avoir une colonne "label" : il sert à donner les noms des valeurs / points
- Les noms des autres colonnes sont ceux des séries de données
 */
const data = {
    repartitionEmissions:
        [
            {label: 'Transport de marchandises', 'Émissions (t.eqCO2)': 42},
            {label: 'Tertiaire', 'Émissions (t.eqCO2)': 29},
            {label: 'Industrie', 'Émissions (t.eqCO2)': 23},
            {label: 'Agriculture', 'Émissions (t.eqCO2)': 4},
            {label: 'Déchets', 'Émissions (t.eqCO2)': 2},
        ]
};
/*
Répertoire des configurations de graphiques, des objets contenant les informations suivantes :
- title: le titre du graphique, ou null si le titre ne doit pas être affiché
- type: le type de graphique, à piocher dans les types de graphique de ChartJS
- legend: true pour afficher la légende, false pour la masquer
 */
const chartsConfigurations = {
    valeurEmissionsActEco: {
        title: null,
        type: 'pie',
        legend: true,
    },
    repartitionEmissions: {
        title: 'Répartition des émissions de gaz à effet de serre des activités économiques',
        type: 'doughnut',
        legend: true,
    },
};
/*
Répertoire des "hooks" : des fonctions à exécuter avant ou après certains évènements de scroll
 */
const hooks = {};

/*
Un petit dictionnaire de couches utilisées dans les différentes cartes interactives. Elles sont à renseigner
directement dans un format couches Leaflet.
osm est la couche de base qui est le fond de cartes.
La fonction geoJsonToLayer permet de charger une couche GeoJSON :
- Mettre le lien relatif vers le fichier
- Rentrer les options au format Leaflet (notamment couleur, opacité)
Les couches doivent être en WGS84
 */
const mapLayers = {
    osm: L.tileLayer('https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        /* Quelques autres liens pour layer de base utilisables :
        Fond OpenStreetMap par défaut :
        https://tile.openstreetmap.org/{z}/{x}/{y}.png
        OpenStreetMap France :
        https://b.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png
        Fond très clair, bien quand très zoomé pour avoir un détail de rue et de bâti sans être très présent
        https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png
        Fond coloré mais plus doux qu’OSM, bien plutôt pour des cartos à l’échelle région
        https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png
        Fond "humanitaire" d’OSM France, ilébo :
        https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png
        */
    }),
    habitants: // Polygones des endroits en France où il y a des habitants
        geoJsonToLayer('data/habitants_ici_simplif.geojson',
            {
                style: {
                    color: '#fa210f',
                    weight: 0,
                    opacity: 0.6
                }
            }
        )
};

/*
Configurations des cartes, sous forme d’un dictionnaire.
Les clés sont les noms des cartes (à renseigner dans l’attribut scroll-map-name dans le HTML)
Chaque configuration est un objet contenant :
- layers : une liste des couches à ajouter à la carte, dans l’ordre (de la couche du dessous à la couche du dessus)
- coordinates : coordonnées par défaut de la carte (au format WGS84)
- zoom : niveau de zoom par défaut (6 est le niveau nécessaire pour afficher toute la France Métropolitaine)
 */
const mapConfigurations = {
    habitants: // Carte des endroits où il y a des habitants
        {
            layers: [mapLayers.osm, mapLayers.habitants],
            coordinates: [47, 3],
            zoom: 6,
        },
};

/*
HTML customs
 */
const customHtml = {}


// JavaScript pour ajuster dynamiquement la marge supérieure de la deuxième boîte
document.addEventListener("DOMContentLoaded", stickyOffsets);

window.addEventListener("resize", stickyOffsets);

function stickyOffsets() {
    console.log("hello !");
    const firstBox = document.getElementById("boite1");
    const secondBox = document.getElementById("boite2");

    // Ajustons dynamiquement la marge supérieure de la deuxième boîte
    secondBox.style.top = 'calc(var(--bulma-navbar-height) + 10px + ' + firstBox.offsetHeight + 'px)';
}