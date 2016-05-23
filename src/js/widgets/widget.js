/**
 *  A widget is a standalone unit of functionality for a
 *  given matching context in Tangram YAML.
 *
 *  An instance of the widget class stores a reference to
 *  its DOM element (and children) and can be extended
 *  with any additional functionality.
 *
 */
import TangramPlay, { editor } from '../tangram-play';

export default class Widget {
    constructor (def, node) {
        this.node = node;
        this.definition = def;
        this.el = this.createEl(node);
    }

    /**
     *  Returns a widget element.
     *  This is a simple bare-bones example.
     *  Widgets that extend from this should create
     *  their own DOM and avoid calling super()
     *  @param node in case the element needs to know something about the source
     */
    createEl (node) {
        return document.createDocumentFragment();
    }

    destroy () {
        if (this.bookmark) {
            this.bookmark.clear();
        }
    }

    updateNode () {
        // Update a widget on a single-node line
        if (this.bookmark &&
            this.bookmark.lines &&
            this.bookmark.lines.length === 1 &&
            this.bookmark.lines[0] &&
            this.bookmark.lines[0].stateAfter &&
            this.bookmark.lines[0].stateAfter.yamlState &&
            this.bookmark.lines[0].stateAfter.yamlState.nodes &&
            this.bookmark.lines[0].stateAfter.yamlState.nodes.length > 0) {
            for (let node of this.bookmark.lines[0].stateAfter.yamlState.nodes) {
                if (this.node.address === node.address) {
                    this.node = node;
                    break;
                }
            }
        }
        // Find the right widget to update if a line has multiple nodes
        else {
            // Here is a good place to detect duplicates
            // let others = TangramPlay.editor.getDoc().findMarksAt(this.node.range.to);
            let node = TangramPlay.getNodesForAddress(this.node.address);
            this.node = node;
        }
    }

    update () {
        this.updateNode();
        // This looks weird but is to force the use of 'get value ()' which
        // clean the anchors
        this.value = this.value;
    }

    insert () {
        this.updateNode();

        let others = TangramPlay.editor.getDoc().findMarksAt(this.node.range.to);
        if (others.length > 0) {
            console.log('Avoiding duplication');
            // if (TangramPlay.addons.errorsManager) {
            //     TangramPlay.addons.errorsManager.addWarning({
            //         type:'duplicate',
            //         nodes: others
            //     });
            // }
            return false;
        }

        // inserts the widget into CodeMirror DOM
        this.bookmark = editor.doc.setBookmark(this.node.range.to, {
            widget: this.el,
            insertLeft: true,
            handleMouseEvents: true
        });
        this.bookmark.widget = this;

        return true;
    }

    /**
     *  Use this property from outside the module (usually by)
     *  the WidgetManager to set a value inside the module.
     *  TODO: Experimental
     */
    get value () {
        let value = this.node.value;
        return value;
    }

    set value (value) {
        this.node.value = value;
    }

    /**
     *  Use this method within a module to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue(string) {
        this.updateNode();

        // Send the value to editor
        TangramPlay.setValue(this.node, string);

        // Change the value attached to this widget instance
        this.node.value = string;
    }
}
