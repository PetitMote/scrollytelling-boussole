/* Constantes */


/*
La donnée est chargée avec en tête les exports de PostgreSQL :
- Un objet, avec comme clés les noms des datasets
- La valeur de chacun est une liste de toutes les lignes
- Une ligne est un objet, les clés étant les noms des colonnes
- Il doit obligatoirement y avoir une colonne "label" : il sert à donner les noms des valeurs / points
- Les noms des autres colonnes sont ceux des séries de données
 */
const data = {};
/*
Répertoire des configurations de graphiques, au format Apache Echarts
 */
const chartsConfigurations = {};
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
        osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
        communes_nm: geoJsonToLayer('data/communes_nm.geojson',
            {
                style: {
                    color: '#FFFFFF',
                    weight: 3,
                    opacity: 1,
                    fill: false,
                }
            }
        ),
        zae: geoJsonToLayer('data/zae.geojson',
            {
                style: {
                    color: '#3a3838',
                    weight: 2,
                    opacity: 0.9,
                    fill: false,
                }
            }
        ),
        conso_zan_zae: geoJsonToLayer('data/conso_zan_naf_zae.geojson',
            {
                style: {
                    color: '#b83c26',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.5,
                }
            }
        ),
        arbres_zae:
            geoJsonToLayer('data/arbres_zae.geojson',
                {
                    style: {
                        color: '#367812',
                        weight: 1,
                        opacity: 0.8,
                        fillOpacity: 0.5,
                    }
                }
            ),
        vegetation_autre:
            geoJsonToLayer('data/vegetation_autre_zae.geojson',
                {
                    style: {
                        color: '#4b9f1a',
                        weight: 1,
                        opacity: 0.8,
                        fillOpacity: 0.5,
                    }
                }
            ),
        icu_zae:
            geoJsonToLayer('data/icu_zae.geojson',
                {
                    style: style_icu
                }
            ),
    }
;

function style_icu(feature) {
    console.log({
        fillColor: color_icu(feature.properties.color),
        fillOpacity: 1,
        stroke: false,
    });
    return {
        fillColor: color_icu(feature.properties.color),
        fillOpacity: 1,
        stroke: false,
    };
}

function color_icu(c) {
    return c === 0 ? '#2b55ba' :
        c === 1 ? '#3661b8' :
            c === 2 ? '#426db6' :
                c === 3 ? '#4d79b4' :
                    c === 4 ? '#5986b2' :
                        c === 5 ? '#6492b0' :
                            c === 6 ? '#709eae' :
                                c === 7 ? '#7baaac' :
                                    c === 8 ? '#87b7aa' :
                                        c === 9 ? '#92c3a8' :
                                            c === 10 ? '#9ecfa6' :
                                                c === 11 ? '#a9dba4' :
                                                    c === 12 ? '#b1e0a2' :
                                                        c === 13 ? '#b8e3a0' :
                                                            c === 14 ? '#c0e69e' :
                                                                c === 15 ? '#c7e99b' :
                                                                    c === 16 ? '#ceec99' :
                                                                        c === 17 ? '#d6ef96' :
                                                                            c === 18 ? '#ddf294' :
                                                                                c === 19 ? '#e4f492' :
                                                                                    c === 20 ? '#ecf78f' :
                                                                                        c === 21 ? '#f3fa8d' :
                                                                                            c === 22 ? '#fafd8b' :
                                                                                                c === 23 ? '#fffc87' :
                                                                                                    c === 24 ? '#fff082' :
                                                                                                        c === 25 ? '#ffe57c' :
                                                                                                            c === 26 ? '#ffd976' :
                                                                                                                c === 27 ? '#fecd70' :
                                                                                                                    c === 28 ? '#fec16a' :
                                                                                                                        c === 29 ? '#feb665' :
                                                                                                                            c === 30 ? '#f38f4d' :
                                                                                                                                c > 30 ? '#d73e18' :
                                                                                                                                    '#000000';
}

/*
Configurations des cartes, sous forme d’un dictionnaire.
Les clés sont les noms des cartes (à renseigner dans l’attribut scroll-map-name dans le HTML)
Chaque configuration est un objet contenant :
- layers : une liste des couches à ajouter à la carte, dans l’ordre (de la couche du dessous à la couche du dessus)
- coordinates : coordonnées par défaut de la carte (au format WGS84)
- zoom : niveau de zoom par défaut (6 est le niveau nécessaire pour afficher toute la France Métropolitaine)
 */
const mapConfigurations = {
    conso_zan:
        {
            layers: [mapLayers.osm, mapLayers.conso_zan_zae, mapLayers.zae, mapLayers.communes_nm],
            coordinates: [47.22, -1.56],
            zoom: 12,
        },
    cadastre_vert:
        {
            layers: [mapLayers.osm, mapLayers.arbres_zae, mapLayers.vegetation_autre, mapLayers.zae, mapLayers.communes_nm],
            coordinates: [47.22, -1.56],
            zoom: 12,
        },
    icu:
        {
            layers: [mapLayers.osm, mapLayers.icu_zae, mapLayers.zae, mapLayers.communes_nm],
            coordinates: [47.22, -1.56],
            zoom: 12,
        }
};

/*
HTML customs
 */
const customHtml = {}