'use strict';

import FileDrop from 'app/addons/ui/FileDrop';
import Menu from 'app/addons/ui/Menu';
import Divider from 'app/addons/ui/Divider';
import MapNavigation from 'app/addons/ui/MapNavigation';

export default class UI {
    constructor () {
        // Set up UI components
        new FileDrop();
        new Menu();
        new Divider('divider');
        new MapNavigation();
    }
}
