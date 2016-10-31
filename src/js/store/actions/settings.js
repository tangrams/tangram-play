import store from '../index';
import { SET_SETTINGS, EDITOR_INCREASE_FONT_SIZE, EDITOR_DECREASE_FONT_SIZE } from './index';

export function setEditorFontSize(fontSize) {
  store.dispatch({
    type: SET_SETTINGS,
    editorFontSize: fontSize,
  });
}

export function increaseEditorFontSize() {
  store.dispatch({
    type: EDITOR_INCREASE_FONT_SIZE,
  });
}

export function decreaseEditorFontSize() {
  store.dispatch({
    type: EDITOR_DECREASE_FONT_SIZE,
  });
}
