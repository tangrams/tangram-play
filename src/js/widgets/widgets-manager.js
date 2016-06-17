import { editor } from '../editor/editor';

export default class WidgetsManager {
    constructor () {
        // On initialization, insert all marks in the current viewport.
        const viewport = editor.getViewport();
        insertMarks(viewport.from, viewport.to);

        // On editor changes, update those marks
        editor.on('changes', (cm, changes) => {
            for (let change of changes) {
                // Each change object specifies a range of lines
                let fromLine = change.from.line;
                let toLine = change.to.line;

                // CodeMirror's `from` and `to` properties are pre-change values, so
                // we adjust the range if lines were removed or added. The `removed`
                // and `text` properties are arrays which indicate how many lines
                // were removed or added respectively.
                if (change.origin === '+delete' || change.origin === 'cut') {
                    // In a delete or cut operation, CodeMirror's `to` line
                    // includes lines have just been removed. However, we don't
                    // want to parse those lines, since they're gone. We will
                    // only reparse the current line.
                    toLine = fromLine;
                }
                else if (change.origin === 'paste' || change.origin === 'undo') {
                    // In a paste operation, CodeMirror's to line is the same
                    // as the from line. We can get the correct to-line by
                    // adding the pasted lines minus the removed lines.
                    // This also captures undo operations where removals of
                    // lines are undone (so it works like a paste)
                    toLine += change.text.length - change.removed.length;
                }

                clearMarks(fromLine, toLine);
                insertMarks(fromLine, toLine);
            }
        });

        // CodeMirror only parses lines inside of the current viewport.
        // When we scroll, we start inserting marks on lines as they're parsed.
        editor.on('scroll', (cm) => {
            const viewport = cm.getViewport();
            const fromLine = viewport.from;
            const toLine = viewport.to;

            insertMarks(fromLine, toLine);
        });
    }
}

/**
 * @param {Number} fromLine - The line number to clear from
 * @param {Number} toLine - Optional. The line number to clear to. If not
 *          provided, just the fromLine is checked.
 */
function clearMarks (fromLine, toLine) {
    // If `to` is not provided, use `from`.
    // Add one to this, so we check the entirety of the `to` line.
    // TODO: verify this works (or we have to get the last character of the `to` line.)
    toLine = (toLine || fromLine) + 1;

    const doc = editor.getDoc();

    // Create a range just for this line.
    const fromPos = { line: fromLine, ch: 0 };
    const toPos = { line: toLine, ch: 0 };

    // Look for stray bookmarks
    let strayBookmarks = doc.findMarks(fromPos, toPos) || [];

    // findMarks() does not find marks that are at the end of a line, but not
    // in the range provided. (This might be a CodeMirror bug?)
    // Manually look for stray bookmarks at the end of these lines, as well.
    for (let line = fromLine; line < toLine; line++) {
        const lineContent = doc.getLine(line) || '';
        const lineLength = lineContent.length;
        const marks = doc.findMarksAt({ line: line, ch: lineLength });
        strayBookmarks = strayBookmarks.concat(marks);
    }

    // And remove them, if present.
    for (let bookmark of strayBookmarks) {
        bookmark.clear();
    }
}

/**
 *
 * @param {Number} fromLine - The line number to insert from
 * @param {Number} toLine - Optional. The line number to insert to. If not
 *          provided, just the fromLine is checked.
 *
 */
function insertMarks (fromLine, toLine) {
    // If `to` is not provided, use `from`.
    toLine = (toLine || fromLine);

    // For each line in the range, get the line handle, check for nodes,
    // check for widgets, and add or remove them.
    for (let line = fromLine; line <= toLine; line++) {
        const newWidgets = [];
        const doc = editor.getDoc();
        const lineHandle = doc.getLineHandle(line);

        // If no lineHandle, then CodeMirror probably has not parsed it yet;
        // continue
        if (!lineHandle || !lineHandle.stateAfter) {
            continue;
        }

        const nodes = lineHandle.stateAfter.nodes || null;

        // If there are no nodes, go to the next line
        if (!nodes) {
            continue;
        }

        for (let node of nodes) {
            // See if there's a widget constructor attached to it, and
            // if so, we create it and insert it into the document.
            // Skip blank lines, which may have the state (and widget
            // constructor) of the previous line.
            if (node.widgetConstructor && lineHandle.text.trim() !== '') {
                const lineNumber = doc.getLineNumber(lineHandle);
                const widget = node.widgetConstructor.create(node);
                if (widget.insert(lineNumber)) {
                    newWidgets.push(widget);
                }
            }
        }
    }

    // TODO: replace this
    // this.trigger('widgets_created', { widgets: newWidgets });
}
