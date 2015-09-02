import TangramPlay from '../../TangramPlay.js';
import CodeMirror from 'codemirror';

CodeMirror.registerHelper('hint', 'yaml', function (editor, options) {
    var cur = editor.getCursor();
    var token = editor.getTokenAt(cur);
    var list = [];

    if (TangramPlay.addons.suggestManager) {
    	list = TangramPlay.addons.suggestManager.getSuggestions(cur);
    } 

    return { list: list,
            from: CodeMirror.Pos(cur.line, token.start+1),
            to: CodeMirror.Pos(cur.line, token.end+1)
        };
});