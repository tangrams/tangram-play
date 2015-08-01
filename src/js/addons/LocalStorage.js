/**
 *  TANGRAM PLAY  ·  Local storage
 *
 *  Provides a common interface for the application where modules can
 *  request storage of values across multiple user sessions via the
 *  browser's LocalStorage API.
 *
 *  Browser support is good, so no fallbacks are implemented.
 *  This module manages namespacing for Tangram Play to prevent name
 *  collisions with other libraries, browser extensions, etc.
 */
'use strict';

const LOCAL_STORAGE_PREFIX = 'tangram-play-';

const LocalStorage = {
    /**
     *  setItem()
     *  Namespaces key name to Tangram Play application and adds
     *  the value to LocalStorage.
     */
    setItem (key, value) {
        if (window.localStorage) {
            window.localStorage.setItem(LOCAL_STORAGE_PREFIX + key, value);
        }
    }

    /**
     *  getItem()
     *  Retrieves value for the given key name and application namespace.
     */
    getItem (key) {
        if (window.localStorage) {
            return window.localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
        }
    }

    /**
     *  removeItem()
     *  Removes key-value pair under the application namespace.
     */
    removeItem (key) {
        if (window.localStorage) {
            window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + key);
        }
    }

    /**
     *  clear()
     *  Loops through all values in localStorage under the application
     *  namespace and removes them, preserving other key-value pairs in
     *  localStorage.
     */
     clear () {
        if (window.localStorage) {
            for (let key in window.localStorage) {
                if (key.indexOf(LOCAL_STORAGE_PREFIX) === 0 {
                    window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + key)
                }
            }
        }
     }
}

export default LocalStorage;
