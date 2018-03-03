const config = {
  // Nextzen key used exclusively by Tangram Play
  NEXTZEN_API_KEY: 'mHPUxCSaRgiJERj1lLDLew',
  MAPZEN_API: {
    ORIGIN: {
      DEVELOPMENT: 'http://localhost',
      STAGING: 'https://dev.mapzen.com',
      PRODUCTION: 'https://mapzen.com',
    },
    SCENE_API_PATH: '/api/scenes/',
    USER_API_PATH: '/api/developer.json',
  },
  TILES: {
    API_KEYS: {
      SUPPRESSED: [
        'mHPUxCSaRgiJERj1lLDLew' // Matches NEXTZEN_API_KEY
      ],
    },
  },
  SEARCH: {
    HOST: 'search.mapzen.com',
  },
};

export default config;
