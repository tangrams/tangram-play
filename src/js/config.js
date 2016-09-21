const config = {
    // Unified API key used exclusively by Tangram Play
    // This key is owned by Mapzen
    MAPZEN_API_KEY: 'mapzen-D8mmijp',
    TILES: {
        API_KEYS: {
            SUPPRESSED: [
                'mapzen-D8mmijp',
                'vector-tiles-P6dkVl4', // Tangram Play, should match API_KEY.DEFAULT
                'vector-tiles-HqUVidw', // Tangram & "house styles"
                'vector-tiles-JUsa0Gc', // Patricio's sandbox
            ],
        },
    },
    SEARCH: {
        HOST: 'search.mapzen.com',
    },
};

export default config;
