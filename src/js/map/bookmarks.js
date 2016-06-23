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
    currentData.data.push(newBookmark);
    LocalStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(currentData));
    return true;
}

function clearData () {
    LocalStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(DEFAULT_BOOKMARKS_OBJECT));
    EventEmitter.dispatch('clearbookmarks', {});
    return true;
}

let bookmarks = {
    saveBookmark,
    clearData,
    readData
};

export default bookmarks;
