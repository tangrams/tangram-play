'use strict';

import FileDrop from 'app/addons/ui/FileDrop';
import Menu from 'app/addons/ui/Menu';
import Divider from 'app/addons/ui/Divider';
import MapToolbar from 'app/addons/ui/MapToolbar';

export default class UI {
    constructor () {
        // Set up UI components
        MapToolbar.init();
        new FileDrop();
        new Menu();
        new Divider('divider');
    }
}
