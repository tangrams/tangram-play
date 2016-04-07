import '../file/file-drop';
import { initDivider } from './divider';
import Menu from '../menus/menu';
import './tooltip';
import MapToolbar from '../map/toolbar';

export default class UI {
    constructor () {
        // Set up UI components
        MapToolbar.init();

        initDivider();

        // TODO: less inheritance
        this.menu = new Menu();
    }
}
