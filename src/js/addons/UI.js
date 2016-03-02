import FileDrop from 'app/addons/ui/FileDrop';
import Menu from 'app/addons/ui/Menu';
import Divider from 'app/addons/ui/Divider';
import Tooltip from 'app/addons/ui/Tooltip';
import MapToolbar from 'app/addons/ui/MapToolbar';

export default class UI {
    constructor () {
        // Set up UI components
        Tooltip.init();
        MapToolbar.init();

        new FileDrop();
        // TODO: less inheritance
        this.menu = new Menu();
        new Divider();
    }
}
