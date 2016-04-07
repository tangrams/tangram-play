import '../file/file-drop';
import { initDivider } from './divider';
import Menu from '../menus/menu';
import './tooltip';

export default class UI {
    constructor () {
        // Set up UI components
        initDivider();

        // TODO: less inheritance
        this.menu = new Menu();
    }
}
