import LocalStorage from '../storage/localstorage';
import { EventEmitter } from '../components/event-emitter';

const STORAGE_BOOKMARKS_KEY = 'bookmarks';
const DEFAULT_BOOKMARKS_OBJECT = {
    data: []
};

function readData () {
    let data = LocalStorage.getItem(STORAGE_BOOKMARKS_KEY);
    if (data) {
        return JSON.parse(data);
    }
    // Returns empty bookmarks object
    else {
        return DEFAULT_BOOKMARKS_OBJECT;
    }
}

function saveBookmark (newBookmark) {
    let currentData = readData();

    // If the bookmarkExists, then return false because we did not add it to the list
    if (bookmarkExists(newBookmark)) {
        return false;
    }
    // Otherwise, add the bookmark to LocalStorage and return true
    else {
        currentData.data.push(newBookmark);
        LocalStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(currentData));
        EventEmitter.dispatch('bookmarks:updated');
        return true;
    }
}

function bookmarkExists (newBookmark) {
    let currentData = readData();
    for (var bookmark of currentData.data) {
        // If the bookmark exists in the saved list, then return true
        if (bookmark.label === newBookmark.label && bookmark.lat === newBookmark.lat &&
            bookmark.lng === newBookmark.lng && bookmark.zoom === newBookmark.zoom) {
            return true;
        }
    }

    // If bookmark does not exist in current list return false
    return false;
}

// Clear all the bookmarks
function clearData () {
    LocalStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(DEFAULT_BOOKMARKS_OBJECT));
    EventEmitter.dispatch('bookmarks:clear', {});
    return true;
}

// Clear only one bookmark
function deleteBookmark (index) {
    LocalStorage.deleteItem(STORAGE_BOOKMARKS_KEY, index);
    EventEmitter.dispatch('bookmarks:clear', {});
    return true;
}

let bookmarks = {
    saveBookmark,
    clearData,
    deleteBookmark,
    readData
};

export default bookmarks;
