'use strict';

import FileDrop from 'app/addons/ui/FileDrop';
import Menu from 'app/addons/ui/Menu';
import Geolocator from 'app/addons/ui/Geolocator';
import Divider from 'app/addons/ui/Divider';

export default class UI {
    constructor () {
        // Set up UI components
        new FileDrop();
        new Menu();
        new Geolocator();
        new Divider('divider');
    }
}
