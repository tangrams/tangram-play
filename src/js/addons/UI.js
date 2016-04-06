import './ui/file-drop';
import { initDivider } from './ui/divider';
import Menu from './ui/Menu';
import Tooltip from './ui/Tooltip';
import MapToolbar from './ui/MapToolbar';

export default class UI {
    constructor () {
        // Set up UI components
        Tooltip.init();
        MapToolbar.init();

        initDivider();

        // TODO: less inheritance
        this.menu = new Menu();
    }
}
