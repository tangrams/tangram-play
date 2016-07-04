/**
 *  A widget is a standalone unit of functionality for a
 *  given matching context in Tangram YAML.
 *
 *  An instance of the widget class stores a reference to
 *  its DOM element (and children) and can be extended
 *  with any additional functionality.
 *
 */
import { editor, setNodeValue } from '../editor/editor';
import { parseYamlString } from '../editor/codemirror/yaml-tangram';

var React = require('react');
var ReactDOM = require('react-dom');
import WidgetColorPicker from '../components/widget-color-picker.react';

export default class Widget {
    constructor (node) {
        // console.log(node);
        this.node = node;
        this.definition = node.widgetMark;
        this.type = node.widgetMark.type;
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
        let el = document.createElement('div');

        switch (this.type) {
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

    insert (lineNumber) {
        this.updateNodeReference(lineNumber);

        const doc = editor.getDoc();

        // Update line number because
        if (lineNumber) {
            this.node.range.to.line = lineNumber;
            this.node.range.from.line = lineNumber;
        }

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
            widget: this.el, // inserted DOM element into position
            insertLeft: true,
            clearWhenEmpty: true,
            handleMouseEvents: false
        });
        this.bookmark.widget = this;

        if(this.type === 'color'){
            console.log("created color");
            ReactDOM.render(<WidgetColorPicker node={this.node} bookmark={this.bookmark}/>, this.el);
        }

        return true;
    }

    updateNodeReference (lineNumber) {
        // Update a widget on a single-node line
        // If for any reason this doesn't work, there's an alternate way to
        // find the right node.
        if (this.bookmark) {
            for (let node of this.bookmark.lines[0].stateAfter.nodes) {
                if (this.node.address === node.address) {
                    this.node = node;
                    break;
                }
            }
        }
        // .getNodesForAddress is VERY slow, so let's avoid calling it
        // if we can - either use the stored node, as above, or
        // only parse the given line number our mark is on.
        else if (lineNumber) {
            const doc = editor.getDoc();
            const text = doc.getLineHandle(lineNumber).text;
            const dummyStateObject = {
                keyStack: []
            };
            const state = parseYamlString(text, dummyStateObject, 4);

            // Iterate through keys in this line
            for (let node of state.nodes) {
                if (node.address === this.node.address) {
                    this.node = node;
                    return;
                }
            }
        }
    }

    update () {
        this.updateNodeReference();
        // This looks weird but is to force the use of 'get value ()' which
        // clean the anchors
        this.value = this.value;
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
        this.updateNodeReference();

        // Send the value to editor
        setNodeValue(this.node, string, '+value_change');

        // Change the value attached to this widget instance
        this.node.value = string;
    }
}
