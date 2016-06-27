/**
 *  A widget is a standalone unit of functionality for a
 *  given matching context in Tangram YAML.
 *
 *  An instance of the widget class stores a reference to
 *  its DOM element (and children) and can be extended
 *  with any additional functionality.
 *
 */

 
import TangramPlay from '../tangram-play';
import { editor } from '../editor/editor';

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
            this.bookmark.lines[0].stateAfter.nodes &&
            this.bookmark.lines[0].stateAfter.nodes.length > 0) {
            for (let node of this.bookmark.lines[0].stateAfter.nodes) {
                if (this.node.address === node.address) {
                    this.node = node;
                    break;
                }
            }
        }
        // Find the right widget to update if a line has multiple nodes
        else {
            // Here is a good place to detect duplicates
            // let others = editor.getDoc().findMarksAt(this.node.range.to);
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

    // REACT: change insert function to put a react component
    insert () {
        this.updateNode();

        const doc = editor.getDoc();

        // Do not insert if another bookmark is already inserted at this point
        const otherMarks = doc.findMarksAt(this.node.range.to);
        let otherBookmarkFound = false;
        for (let mark of otherMarks) {
            // Must match this type. Other marks, like the CodeMirror's
            // matching brackets add-on, creates a TextMarker of type `range`,
            // and we want to make sure widget bookmarks are added even other
            // mark types are present.
            if (mark.type === 'bookmark') {
                otherBookmarkFound = true;
                break;
            }
        }
        if (otherBookmarkFound === true) {
            return false;
        }

        // inserts the widget into CodeMirror DOM
        this.bookmark = doc.setBookmark(this.node.range.to, {
            widget: this.el,
            insertLeft: true,
            handleMouseEvents: false
        });
        this.bookmark.widget = this;

        // let test = document.getElementById('react-color0');
        // console.log(test);
        // ReactDOM.render(<WidgetColorPicker />, test);

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
    setEditorValue (string) {
        this.updateNode();

        // Send the value to editor
        TangramPlay.setValue(this.node, string);

        // Change the value attached to this widget instance
        this.node.value = string;
    }
}
