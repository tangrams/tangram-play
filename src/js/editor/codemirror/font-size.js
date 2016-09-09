/* eslint-disable import/prefer-default-export */
/**
 * Change font size in editor. Increments or decrements by 1px.
 * Font size will never go below 8px.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor.
 * @param {increase} Boolean - if true, font size goes up. If false, font size
 *              goes down.
 */
export function changeFontSize(cm, increase) {
    const MINIMUM_FONT_SIZE = 8;
    const el = cm.getWrapperElement();
    const fontSize = window.getComputedStyle(el).getPropertyValue('font-size');
    const adjustment = increase ? 1 : -1;
    const newSize = Math.max(window.parseInt(fontSize, 10) + adjustment, MINIMUM_FONT_SIZE);
    el.style.fontSize = `${newSize.toString()}px`;
    cm.refresh();
}
