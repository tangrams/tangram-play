import TangramPlay from '../tangram-play';
import { editor } from '../editor/editor';
import ColorPicker from '../pickers/color';
import { toCSS } from '../tools/common';
import { jumpToLine } from '../editor/codemirror/tools';

export default class ColorPalette {
    constructor () {
        // if (TangramPlay.addons.widgetsManager === undefined) {
        //     return;
        // }
        //
        // this.colors = {};
        // this.palette = document.createElement('div');
        // this.palette.className = 'colorpalette';
        // document.body.appendChild(this.palette);
        //
        // TangramPlay.addons.widgetsManager.on('widgets_created', (args) => {
        //     TangramPlay.addons.colorPalette.update(args);
        // });
        //
        // TangramPlay.addons.widgetsManager.on('widget_updated', (args) => {
        //     TangramPlay.addons.colorPalette.update(args);
        // });
        //
        // // If is a new file load all colors by going to the end and comeback
        // TangramPlay.on('sceneload', (event) => {
        //     for (let i = 0; i < editor.getDoc().size; i++) {
        //         jumpToLine(editor, i);
        //     }
        //     jumpToLine(editor, 0);
        // });
    }

    update (args) {
        // Clean colors
        this.colors = {};

        // Find all bookmarks
        let bookmarks = editor.getDoc().getAllMarks();

        // check for color picker widgets
        for (let bkm of bookmarks) {
            if (bkm.widget && bkm.widget.definition.type === 'color') {
                let color = bkm.widget.el.style.backgroundColor;
                if (this.colors[color] === undefined) {
                    this.colors[color] = new Color(color);
                }
                this.colors[color].widgets.push(bkm.widget);
            }
        }
        this.make();
    }

    make () {
        this.palette.innerHTML = '';

        for (let color in this.colors) {
            this.palette.appendChild(this.colors[color].el);
        }
    }
}

class Color {
    constructor (color) {
        color = toCSS(color);

        // DOM
        this.el = document.createElement('div');
        this.el.className = 'colorpalette-element';
        this.el.style.background = color;
        this.el.addEventListener('click', this.onClick.bind(this));

        // Local Variables
        this.widgets = [];
        this.color = color;
    }

    /**
     *  Sets this.color
     *  Automatically changes widget background color
     *  Assumes color property is a CSS color.
     *  Be sure to convert value parameter to a CSS-readable value.
     */
    set color (cssColor) {
        this.el.style.backgroundColor = cssColor;
        this.el.style.background = cssColor;
    }

    get color () {
        return this.el.style.background;
    }

    select () {
        // Select all instances
        let selections = [];
        for (let i = 0; i < this.widgets.length; i++) {
            selections.push({
                anchor: this.widgets[i].node.range.from,
                head: this.widgets[i].node.range.to
            });
        }
        editor.getDoc().setSelections(selections);
    }

    onClick (event) {
        this.select();

        // Toggles the picker to be off if it's already present.
        if (this.picker && this.picker.isVisible) {
            this.picker.removeModal();
            return;
        }
        // If no picker is created yet, do it now
        else if (!this.picker) {
            this.picker = new ColorPicker(this.color);
        }

        // Turn the picker on and present modal
        let pos = this.el.getBoundingClientRect();

        // Thistle modal size
        const modalWidth = 260;
        const modalHeight = 270;

        // Set x, y pos depending on widget position. Do not allow the modal
        // to disappear off the edge of the window.
        let modalXPos = pos.right - modalWidth;
        let modalYPos = pos.top - modalHeight - 5;

        this.picker.presentModal(modalXPos, modalYPos);

        // Note: this fires change events as a live preview of the color.
        // TODO: Store original value so we can go back to it if the
        // interaction is canceled.
        this.picker.on('changed', this.onPickerChange.bind(this));
        editor.focus();
    }

    /**
     *  Handles when user selects a new color on the colorpicker
     */
    onPickerChange (event) {
        this.color = event.getString('rgb'); // this.picker.getCSS();

        // Convert the CSS color value to Tangram format for editor.
        let color = event.get('vec'); // this.picker.getRGB();
        let rgbString = [1, 1, 1];

        rgbString = `[${color.v.toFixed(3)}, ${color.e.toFixed(3)}, ${color.c.toFixed(3)}]`;

        for (let i = 0; i < this.widgets.length; i++) {
            this.widgets[i].setEditorValue(rgbString);
        }

        this.select();
    }
}
