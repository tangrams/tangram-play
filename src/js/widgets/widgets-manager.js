import { editor } from '../editor/editor';
import TangramPlay from '../tangram-play';

/**
 * Initializes widget marks in the current editor viewport and adds event
 * listeners to handle new marks that need to be created as the editor content
 * is changed on scrolled.
 */
export function initWidgetMarks () {
    // On initialization, insert all marks in the current viewport.
    const viewport = editor.getViewport();
    insertMarks(viewport.from, viewport.to);

    // On editor changes, update those marks
    editor.on('changes', handleEditorChanges);

    // CodeMirror only parses lines inside of the current viewport.
    // When we scroll, we start inserting marks on lines as they're parsed.
    editor.on('scroll', handleEditorScroll);
}

/**
 * Handler function for the CodeMirror `changes` event.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor.
 * @param {Array} changes - an array of change objects representing changes in
 *          editor content.
 */
function handleEditorChanges (cm, changes) {
    for (let change of changes) {
        // Each change object specifies a range of lines
        let fromLine = change.from.line;
        let toLine = change.to.line;

        // Changes from a widget popup mark its origin as `+value_change`
        // Just call insertMarks, which will determine whether a mark should be
        // inserted, if not already. Don't clear marks here, which causes the
        // widget popups to lose contact with the original widget bookmark.
        if (change.origin === '+value_change' && fromLine === toLine) {
            insertMarks(fromLine, toLine);
        }
        else {
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
    }
}

/**
 * Handler function for the CodeMirror `scroll` event.
 * As the different parts of the viewport come into view, insert widget marks
 * that may exist in the viewport.
 *
 * @param {CodeMirror} cm - instance of CodeMirror editor.
 */
function handleEditorScroll (cm) {
    const viewport = cm.getViewport();
    insertMarks(viewport.from, viewport.to);
}

/**
 * Returns an array of existing marks
 *
 * @param {Number} fromLine - The line number to start looking from
 * @param {Number} toLine - Optional. The line number to look to. If not
 *          provided, just the fromLine is checked.
 */
function getExistingMarks (fromLine, toLine) {
    // If `to` is not provided, use `from`.
    // Add one to this, so we check the entirety of the `to` line. This seems to
    // be an effective shorthand which means we do not have to obtain the
    // length of the `from` line.
    toLine = (toLine || fromLine) + 1;

    const doc = editor.getDoc();

    // Create position objects representing the range to find marks in.
    const fromPos = { line: fromLine, ch: 0 };
    const toPos = { line: toLine, ch: 0 };

    // Look for existing text markers
    let foundMarks = doc.findMarks(fromPos, toPos) || [];

    // findMarks() does not find marks on empty lines even if it is within the
    // range provided. (This might be a CodeMirror bug?) In this case, we
    // manually check each line to see if it is empty, and if so, explicitly
    // search for a mark at the zero-character position on that line.
    for (let line = fromLine; line < toLine; line++) {
        const lineContent = doc.getLine(line) || '';
        if (lineContent.length === 0) {
            const marks = doc.findMarksAt({ line: line, ch: 0 });
            foundMarks = foundMarks.concat(marks);
        }
    }

    // Filter out anything that is not of type `bookmark`. Text markers can
    // come from different sources, such as the matching-brackets plugin for
    // CodeMirror. We only want widget bookmarks.
    const existingMarks = foundMarks.filter(marker => {
        return marker.type === 'bookmark' && marker.hasOwnProperty('widget');
    });

    return existingMarks;
}

/**
 * Removes all existing widget bookmarks.
 *
 * @param {Number} fromLine - The line number to clear from
 * @param {Number} toLine - Optional. The line number to clear to. If not
 *          provided, just the fromLine is checked.
 */
function clearMarks (fromLine, toLine) {
    const existingMarks = getExistingMarks(fromLine, toLine);
    // And remove them, if present.
    for (let bookmark of existingMarks) {
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

    const newWidgets = [];

    // For each line in the range, get the line handle, check for nodes,
    // check for widgets, and add or remove them.
    for (let line = fromLine; line <= toLine; line++) {
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
            if (node.widgetMarkConstructor && lineHandle.text.trim() !== '') {
                const lineNumber = doc.getLineNumber(lineHandle);
                const widget = node.widgetMarkConstructor.create(node);
                if (widget.insert(lineNumber)) {
                    newWidgets.push(widget);
                }
            }
        }
    }

    // Trigger an event for created widgets - this is picked up by the color palette
    TangramPlay.trigger('widget_marks_created', { widgets: newWidgets });
}
