import localforage from 'localforage';

const LOCAL_STORAGE_PREFIX = 'tangram-play-';

// This is a temporary migration.
// TODO: Remove / deprecate in v1.0 or when appropriate.
export function migrateLocalStorageToForage () {
    if (!window.localStorage) {
        return;
    }

    moveEverything();
}

function moveEverything () {
    for (let keyName in window.localStorage) {
        if (keyName.startsWith(LOCAL_STORAGE_PREFIX)) {
            const value = window.localStorage.getItem(keyName);
            // Strips prefix from keyname, e.g. `tangram-play-longitude`
            // becomes `longitude`
            const newKeyName = keyName.substring(LOCAL_STORAGE_PREFIX.length);

            let newValue;

            // We can store different data types, so we're converting these now.
            switch (newKeyName) {
                case 'bookmarks':
                    newValue = JSON.parse(value).data || [];
                    break;
                case 'gists':
                    newValue = JSON.parse(value).arr || [];
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
                    newValue = JSON.parse(value) || {};
                    break;
                case 'divider-position-x':
                case 'latitude':
                case 'longitude':
                case 'zoom':
                    newValue = Number(value);
                    break;
                case 'map-toolbar-display':
                    newValue = Boolean(value);
                    break;
            }

            // Check if the value is already in the store; if so, don't overwrite
            localforage.getItem(newKeyName)
                .then((value) => {
                    if (!value) {
                        localforage.setItem(newKeyName, newValue, function (err, value) {
                            if (err) {
                                console.log(`[migrating localstorage] Error setting ${newKeyName}`);
                            }
                            else {
                                console.log(`[migrating localstorage] Saved ${value} to ${newKeyName}`);

                                // Delete the saved value.
                                window.localStorage.removeItem(keyName);
                            }
                        });
                    }
                }).catch((err) => {
                    console.log(`[migrating localstorage] Error checking if ${newKeyName} is already in storage.`);
                });

        }
    }
}
