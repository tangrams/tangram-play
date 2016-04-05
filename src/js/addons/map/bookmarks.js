import { map, container } from '../../TangramPlay';
import LocalStorage from '../LocalStorage';
import Modal from '../ui/Modal';

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
        msgEl.className = 'tp-bookmark-message';
        msgEl.textContent = 'No bookmarks yet!';
        menuEl.appendChild(msgEl);
    }
    else {
        const listEl = document.createElement('ul');
        listEl.className = 'tp-bookmark-list';
        menuEl.appendChild(listEl);

        for (let i = 0, j = bookmarks.length; i < j; i++) {
            const bookmark = bookmarks[i];
            const bookmarkEl = document.createElement('li');

            let fractionalZoom = Math.floor(bookmark.zoom * 10) / 10;

            bookmarkEl.className = 'tp-bookmark-item';
            bookmarkEl.coordinates = { lat: bookmark.lat, lng: bookmark.lng };
            bookmarkEl.zoom = bookmark.zoom;
            bookmarkEl.innerHTML = `<i class='bts bt-map-marker'></i> <span class='tp-bookmark-label'>${bookmark.label}</span> <br><span class='tp-bookmark-meta'>${bookmark.lat.toFixed(4)}, ${bookmark.lng.toFixed(4)}, z&#8202;${fractionalZoom.toFixed(1)}</span>`;
            listEl.appendChild(bookmarkEl);
        }

        // Create a delete bookmarks button
        const deleteEl = document.createElement('li');
        deleteEl.className = 'tp-bookmark-item tp-bookmark-clear';
        deleteEl.textContent = 'Clear bookmarks';
        deleteEl.addEventListener('click', onClickDeleteBookmarks, false);
        listEl.appendChild(deleteEl);
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

    if (!coordinates || !zoom) {
        return;
    }

    map.leaflet.setView(coordinates, zoom);
    clearMenu();

    // When you select a bookmark, highlight the star to indicate that
    // it's a location you saved.
    // TODO: This is hacky, do this better, elsewhere
    window.setTimeout(function () {
        container.querySelector('.tp-map-save-icon').classList.add('tp-active');
    }, 0);
}

function onClickDeleteBookmarks (event) {
    const abort = function (event) {
        event.stopImmediatePropagation();
    };
    const modal = new Modal('Are you sure you want to clear your bookmarks? This cannot be undone.', clearData, abort);
    modal.show();
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
