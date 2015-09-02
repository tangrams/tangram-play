import CodeMirror from 'codemirror';

CodeMirror.registerHelper('hint', 'yaml', function (editor, options) {
    var cur = editor.getCursor();
    var token = editor.getTokenAt(cur);
    var list = [];

    if (TangramPlay.addons.suggestManager) {
    	
    } 

    return { list: list,
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)
        };
});