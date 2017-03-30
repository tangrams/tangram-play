```
electron-packager ./ "Tangram Work" --icon="app_icon" --overwrite --prune --ignore=browserify-cache.json --ignore=embedded.js --ignore=node_modules
```

building for linux x64
```
DEBUG=electron-packager electron-packager ./ "Tangram Work" --icon="app_icon" --overwrite --prune --ignore=browserify-cache.json --ignore=embedded.js --ignore=node_modules --platform=linux --arch=x64
```

- why are folders created not deletable without using sudo in terminal?
- remove LICENSE from packages, they are GitHub licenses not Mapzen licenses


important: https://github.com/electron/electron/issues/7300

## limitations

- geolocation requires a google api key for the app
