import { hint } from '../suggest';
import CodeMirror from 'codemirror';

CodeMirror.registerHelper('hint', 'yaml', function (editor, options) {
    return hint(editor, options);
});
