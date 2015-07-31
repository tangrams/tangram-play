'use strict';

import TangramPlay from '../TangramPlay.js';
import Divider from './ui/Divider.js';
import FileDrop from './ui/FileDrop.js';
import Menu from './ui/Menu.js';
import Geolocator from './ui/Geolocator.js';

export default class UI {
    constructor () {
        // Set up UI components
        new FileDrop();
        new Menu();
        new Geolocator();
        new Divider('divider');
    }
}
