'use strict';

import FileDrop from './ui/FileDrop.js';
import Menu from './ui/Menu.js';
import Geolocator from './ui/Geolocator.js';

export default class UI {
    constructor (TANGRAM_PLAY) {
        const container = TANGRAM_PLAY.container;
        const options = TANGRAM_PLAY.options;

        // Set up UI components
        new FileDrop(container);
        new Menu(options);
        new Geolocator();

        // TODO: Manage history / routing in its own module
        window.onpopstate = function (e) {
            if (e.state && e.state.loadStyleURL) {
                TANGRAM_PLAY.loadQuery();
            }
        };
    }
}
