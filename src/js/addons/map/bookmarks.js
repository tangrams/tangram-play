'use strict';

import LocalStorage from 'app/addons/LocalStorage';
import { map, container } from 'app/TangramPlay';

const STORAGE_BOOKMARKS_KEY = 'bookmarks';
const DEFAULT_BOOKMARKS_OBJECT = {
    data: []
};

let el, buttonEl, menuEl;

function init () {
    el = container.querySelector('.tp-map-bookmarks');
    buttonEl = el.querySelector('.tp-map-bookmarks-button');
    menuEl = el.querySelector('.tp-map-bookmarks-menu');

    menuEl.addEventListener('click', onMenuClickHandler, false);
    buttonEl.addEventListener('click', event => {
        if (!buttonEl.classList.contains('tp-active')) {
            showMenu();
        }
        else {
            clearMenu();
        }
    }, false);
}

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

function clearData () {
    LocalStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(DEFAULT_BOOKMARKS_OBJECT));
    return true;
}

function saveBookmark (newBookmark) {
    let currentData = readData();
    currentData.data.push(newBookmark);
    LocalStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(currentData));
    return true;
}

function showMenu () {
    let bookmarks = readData().data;

    // Reset and display menu container
    menuEl.innerHTML = '';
    menuEl.style.display = 'block';

    if (bookmarks.length === 0) {
        const msgEl = document.createElement('div');
        msgEl.className = 'tp-map-bookmarks-message';
        msgEl.textContent = 'No bookmarks yet!';
        menuEl.appendChild(msgEl);
    }
    else {
        const listEl = document.createElement('ul');
        listEl.className = 'tp-map-bookmarks-list';
        menuEl.appendChild(listEl);

        for (let i = 0, j = bookmarks.length; i < j; i++) {
            const bookmark = bookmarks[i];
            const bookmarkEl = document.createElement('li');

            let fractionalZoom = Math.floor(bookmark.zoom * 10) / 10;

            bookmarkEl.className = 'tp-map-bookmark-item';
            bookmarkEl.coordinates = { lat: bookmark.lat, lng: bookmark.lng };
            bookmarkEl.zoom = bookmark.zoom;
            bookmarkEl.innerHTML += `<i class='bts bt-map-marker'></i> <span class='tp-map-bookmark-label'>${bookmark.label}</span> <br><span class='tp-map-bookmark-meta'>${bookmark.lat.toFixed(4)}, ${bookmark.lng.toFixed(4)}, z&#8202;${fractionalZoom.toFixed(1)}</span>`;
            listEl.appendChild(bookmarkEl);
        }
    }

    buttonEl.classList.add('tp-active');

    container.addEventListener('click', onClickOutsideMenu, false);
}

function clearMenu () {
    menuEl.innerHTML = '';
    menuEl.style.display = 'none';
    buttonEl.classList.remove('tp-active');
    container.removeEventListener('click', onClickOutsideMenu, false);
}

function onMenuClickHandler (event) {
    let selected = event.target;

    const findParent = function () {
        if (selected && selected.nodeName !== 'LI') {
            selected = selected.parentElement;
            findParent();
        }
        return selected;
    };

    // click event can be registered on the child nodes
    // that does not have the required coords prop
    // so its important to find the parent.
    findParent();

    if (selected) {
        gotoBookmark(selected);
    }
}

function gotoBookmark (selectedEl) {
    const coordinates = selectedEl.coordinates;
    const zoom = selectedEl.zoom;
    map.setView(coordinates);
    map.setZoom(zoom);
    clearMenu();
}

function onClickOutsideMenu (event) {
    let target = event.target;

    while (target !== document.documentElement && !target.classList.contains('tp-map-bookmarks')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('tp-map-bookmarks')) {
        clearMenu();
    }
}

let bookmarks = {
    init,
    showMenu,
    saveBookmark,
    clearData
};

export default bookmarks;
