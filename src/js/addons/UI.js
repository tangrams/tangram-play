import './ui/file-drop';
import Menu from './ui/Menu';
import Divider from './ui/Divider';
import Tooltip from './ui/Tooltip';
import MapToolbar from './ui/MapToolbar';

export default class UI {
    constructor () {
        // Set up UI components
        Tooltip.init();
        MapToolbar.init();

        // TODO: less inheritance
        this.menu = new Menu();
        new Divider();
    }
}
