import TangramPlay from '../../tangram-play';
import CodeMirror from 'codemirror';

CodeMirror.registerHelper('hint', 'yaml', function (editor, options) {
    if (TangramPlay.addons.suggestManager) {
        return TangramPlay.addons.suggestManager.hint(editor, options);
    }
    else {
        return {};
    }
});
