import localforage from 'localforage';

const LOCAL_STORAGE_PREFIX = 'tangram-play-';
let FORCE_MIGRATE = false;

// This is a temporary migration.
// TODO: Remove / deprecate in v1.0 or when appropriate.
export function migrateLocalStorageToForage () {
    // Wrapped in try/catch to avoid "Access denied" errors.
    try {
        if (!('localStorage' in window)) {
            return;
        }
    }
    catch (error) {
        return;
    }

    moveEverything();
}

// Temp global to force migration to run
window.migrateLocalStorage = function () {
    FORCE_MIGRATE = true;
    migrateLocalStorageToForage();
};

function moveEverything () {
    for (let keyName in window.localStorage) {
        if (keyName.startsWith(LOCAL_STORAGE_PREFIX)) {
            // Strips prefix from keyname, e.g. `tangram-play-longitude`
            // becomes `longitude`
            const newKeyName = keyName.substring(LOCAL_STORAGE_PREFIX.length);

            // Skip lat, lng, zoom
            if (newKeyName === 'latitude' || newKeyName === 'longitude' || newKeyName === 'zoom') {
                continue;
            }

            // Check if the value is already in the store; if so, don't overwrite
            localforage.getItem(newKeyName)
                .then((value) => { // eslint-disable-line no-loop-func
                    if (!value || FORCE_MIGRATE === true) {
                        if (FORCE_MIGRATE === true) {
                            console.log(`[migrating localstorage] old value for ${newKeyName} exists, forcefully overwriting...`);
                        }
                        else {
                            console.log(`[migrating localstorage] migrating ${newKeyName}...`);
                        }

                        const oldValue = window.localStorage.getItem(keyName);

                        let newValue;

                        // We can store different data types, so we're converting these now.
                        switch (newKeyName) {
                            case 'bookmarks':
                                newValue = JSON.parse(oldValue).data || [];
                                break;
                            case 'gists':
                                newValue = JSON.parse(oldValue).arr || [];
                                for (let i = 0, j = newValue.length; i < j; i++) {
                                    try {
                                        // TODO: Convert base64 URLs to image blob?
                                        newValue[i] = JSON.parse(newValue[i]);
                                    }
                                    catch (err) {
                                        console.log(`[migrating localstorage] ${newValue[i]} is either a legacy Gist format or an unparseable entry; it is not being migrated.`);
                                    }
                                }
                                break;
                            case 'last-content':
                                newValue = JSON.parse(oldValue) || {};
                                break;
                            case 'divider-position-x':
                                newValue = Number(oldValue);
                                break;
                            case 'map-toolbar-display':
                                newValue = Boolean(oldValue);
                                break;
                        }

                        localforage.setItem(newKeyName, newValue, function (err, value) {
                            if (err) {
                                console.log(`[migrating localstorage] Error setting ${newKeyName}`);
                            }
                            else {
                                console.log(`[migrating localstorage] Saved ${value} to ${newKeyName}`);

                                // Delete the saved value.
                                // window.localStorage.removeItem(keyName);
                            }
                        });
                    }
                }).catch((err) => {
                    console.log(`[migrating localstorage] Error checking if ${newKeyName} is already in storage.`, err);
                });
        }
    }

    convertMapViewToObject();
}

function convertMapViewToObject () {
    const lat = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + 'latitude');
    const lng = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + 'longitude');
    const zoom = window.localStorage.getItem(LOCAL_STORAGE_PREFIX + 'zoom');

    // If any of these are not present, then this is not meaningful to save
    // - let's move on
    if (!lat || !lng || !zoom) {
        return;
    }

    const obj = {
        lat: Number(lat),
        lng: Number(lng),
        zoom: Number(zoom)
    };

    localforage.getItem('last-map-view')
        .then((value) => {
            if (!value) {
                return localforage.setItem('last-map-view', obj);
            }
        })
        // .then(() => {
        //     window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'latitude');
        //     window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'longitude');
        //     window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'zoom');
        // })
        .catch((err) => {
            console.log('[migrating localstorage] Error converting map view to object', err);
        });
}
