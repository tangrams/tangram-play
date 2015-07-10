import Widget from "./Widget.js"

export default class ToggleButton extends Widget {
    constructor(manager, datum){
        super(manager,datum);
    }

    create(keyPair, cm) {
        let el = document.createElement('input');
        el.type = 'checkbox';
        el.className = 'tangram-play-widget tangram-play-widget-toggle';
        el.checked = (keyPair.value === 'true') ? true : false;
        el.value = String(keyPair.pos.line) + "-" + String(keyPair.index);
        el.addEventListener('change', function (e) {
            cm.tangram_play.setValue(cm.tangram_play.getKeyForStr(el.value), el.checked?"true":"false" );
        });
        return this.wrap(el,keyPair);
    }
};
