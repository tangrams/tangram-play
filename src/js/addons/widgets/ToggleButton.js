import Widget from './Widget.js'

export default class ToggleButton extends Widget {
    createEl () {
        let el = document.createElement('input');

        el.type = 'checkbox';
        el.className = 'tp-widget tp-widget-toggle';
        el.checked = (this.key.value === 'true') ? true : false;

        el.addEventListener('change', (event) => {
            this.setEditorValue((el.checked) ? 'true' : 'false');
        });

        return el;
    }
}
