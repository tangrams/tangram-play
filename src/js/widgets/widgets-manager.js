import { editor } from '../editor/editor';

import React from 'react';
import ReactDOM from 'react-dom';
import WidgetColor from '../components/widgets/widget-color/widget-color.react';
import WidgetDropdown from '../components/widgets/widget-dropdown.react';
// import WidgetVector from '../components/widgets/widget-vector/widget-vector.react';
import WidgetToggle from '../components/widgets/widget-toggle.react';

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
 * Returns an array of existing marks between a range of lines.
 * This abstracts over CodeMirror's `findMarks()` method, which requires
 * giving it character positions, and does not find marks that are located
 * at the edge of a character range (you would need `findMarksAt()` for that).
 * Furthermore, `findMarks()` fails to locate marks on blank lines within the
 * given range.
 *
 * In our implementation, you only need to provide line numbers, and we'll
 * iterate through each line, calling `findMarks` and `findMarksAt` to make
 * sure that all marks on those lines are found.
 *
 * @param {Number} fromLine - The line number to start looking from
 * @param {Number} toLine - Optional. The line number to look to. If not
 *          provided, just the fromLine is checked.
 */
function getExistingMarks (fromLine, toLine) {
    // If `to` is not provided, use `from`.
    toLine = fromLine;

    const doc = editor.getDoc();
    let existingMarks = [];

    for (let line = fromLine; line <= toLine; line++) {
        const lineContent = doc.getLine(line) || '';

        // Create position objects representing the range of this line
        const fromPos = { line: line, ch: 0 };
        const toPos = { line: line, ch: lineContent.length };

        // Look for existing text markers within this range
        const foundMarks = doc.findMarks(fromPos, toPos) || [];
        existingMarks = existingMarks.concat(foundMarks);

        // `findMarks()` does not find marks at the outer edge of a range.
        // Nor will it find marks located on blank lines, even if it is within
        // the range. So we must specifically check the end of each line,
        // including position 0 of a blank line, for a mark.
        const trailingMarks = doc.findMarksAt(toPos);
        existingMarks = existingMarks.concat(trailingMarks);
    }

    // Filter out anything that is not of type `bookmark`. Text markers can
    // come from different sources, such as the matching-brackets plugin for
    // CodeMirror. We only want widget bookmarks.
    existingMarks = existingMarks.filter(marker => {
        return marker.type === 'bookmark' && marker.hasOwnProperty('widgetNode');
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
        ReactDOM.unmountComponentAtNode(bookmark.replacedWith);
        bookmark.clear();
        // TODO: unmount divs
    }
}

function createEl (type) {
    let el = document.createElement('div');

    switch (type) {
        case 'color':
            el.className = 'widget-parent widget-color';
            break;
        case 'boolean':
            el.className = 'widget-parent widget-boolean';
            break;
        case 'string':
            el.className = 'widget-parent widget-string';
            break;
        case 'vector':
            el.className = 'widget-parent widget-vector';
            break;
        default:
            // Nothing
            break;
    }

    return el;
    // return document.createDocumentFragment();
}

function isThereMark (to) {
    const doc = editor.getDoc();
    const otherMarks = doc.findMarksAt(to);

    // If there is a mark return true
    for (let mark of otherMarks) {
        if (mark.type === 'bookmark') {
            return true;
        }
    }

    // If there is no mark at this location return false
    return false;
}

/**
 *
 * @param {Number} fromLine - The line number to insert from
 * @param {Number} toLine - Optional. The line number to insert to. If not
 *          provided, just the fromLine is checked.
 */
function insertMarks (fromLine, toLine) {
    // If `to` is not provided, use `from`.
    toLine = (toLine || fromLine);

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
            if (node.widgetMark && lineHandle.text.trim() !== '') {
                const lineNumber = doc.getLineNumber(lineHandle);

                let mytype = node.widgetMark.type;

                // TODO: What does this do?
                if (lineNumber) {
                    node.range.to.line = lineNumber;
                    node.range.from.line = lineNumber;
                }

                let myboolean = isThereMark(node.range.to);

                let mybookmark = {};

                if (!myboolean) {
                    let myel = createEl(mytype);
                    // ReactDOM.unmountComponentAtNode(myel);

                    // inserts the widget into CodeMirror DOM
                    mybookmark = doc.setBookmark(node.range.to, {
                        widget: myel, // inserted DOM element into position
                        insertLeft: true,
                        clearWhenEmpty: true,
                        handleMouseEvents: false
                    });
                    // We attach a the node with all the info on the wiget to a property of the bookmark
                    // 'bookmark' becomes parent to property 'widgetInfo' that represents a node
                    mybookmark.widgetInfo = node;

                    if (mytype === 'color') {
                        ReactDOM.render(<WidgetColor bookmark={mybookmark}/>, myel);
                    }
                    else if (mytype === 'string') {
                        ReactDOM.render(<WidgetDropdown bookmark={mybookmark}/>, myel);
                    }
                    // Disabling vector for now
                    // else if (mytype === 'vector') {
                    //     ReactDOM.render(<WidgetVector bookmark={mybookmark}/>, myel);
                    // }
                    else if (mytype === 'boolean') {
                        ReactDOM.render(<WidgetToggle bookmark={mybookmark}/>, myel);
                    }
                }
            }
        }
    }
}
