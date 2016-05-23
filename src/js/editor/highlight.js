import { editor } from '../tangram-play';

/**
 * Given a node, find all the lines that are part of that entire block, and then
 * apply a class name to each of those lines. The class might have the effect of
 * 'highlighting' that section.
 *
 * @param {Object} node - YAML-Tangram node object
 * @param {string} className - the class name to apply to each line in the block
 */
export function highlightBlock (node, className) {
    // First, remove all existing instances of this classname.
    unhighlightAll(className);

    // Next, highlight the line number given in the range of the address.
    // The range is only one line (it doesn't store the range of the block, just the address)
    const blockLine = node.range.from.line;
    const blockLevel = editor.doc.getLineHandle(blockLine).stateAfter.yamlState.keyLevel;
    editor.doc.addLineClass(blockLine, 'wrap', className);

    // Now, go through each subsequent line and highlight the line until the block
    // is over.
    // TODO: refactor for performance
    let nextLine = blockLine + 1;
    let nextLevel = editor.doc.getLineHandle(nextLine).stateAfter.yamlState.keyLevel;
    while (nextLevel > blockLevel) {
        editor.doc.addLineClass(nextLine, 'wrap', className);
        nextLine++;
        nextLevel = editor.doc.getLineHandle(nextLine).stateAfter.yamlState.keyLevel;
    }
}

/**
 * Given a class name, removes it from all lines in the document.
 *
 * @param {string} className - the class name to remove from the document
 */
export function unhighlightAll (className) {
    for (let i = 0, j = editor.doc.lineCount(); i <= j; i++) {
        editor.doc.removeLineClass(i, 'wrap', className);
    }
}
