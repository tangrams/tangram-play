import React from 'react';
import { connect } from 'react-redux';
import Draggable from 'react-draggable';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import IconButton from './IconButton';
import EventEmitter from './event-emitter';
import { editor, parsedYAMLDocument } from '../editor/editor';
import { getKeyAddressForNode } from '../editor/yaml-ast';

// Redux
import { SET_SETTINGS } from '../store/actions';

import TANGRAM from '../tangram-docs.json';

const INITIAL_HEIGHT = 200;

/**
 * Represents the main map panel that user can toggle in and out of the leaflet
 * map.
 */
class DocsPanel extends React.Component {
  /**
   * Used to setup the state of the component. Regular ES6 classes do not
   * automatically bind 'this' to the instance, therefore this is the best
   * place to bind event handlers
   *
   * @param props - parameters passed from the parent
   */
  constructor(props) {
    super(props);

    this.MIN_HEIGHT = 50;

    this.state = {
      display: {},
    };

    this.lastSavedHeight = INITIAL_HEIGHT;

    this.onDrag = this.onDrag.bind(this);
    this.onClickChild = this.onClickChild.bind(this);
    this.onEditorCursorActivity = this.onEditorCursorActivity.bind(this);
    this.openPanel = this.openPanel.bind(this);
    this.closePanel = this.closePanel.bind(this);
  }

  componentDidMount() {
    // Respond to changes in cursor position. If the editor is not present
    // at the time of mounting, add a event listener to listen for readiness.
    if (editor) {
      editor.on('cursorActivity', this.onEditorCursorActivity);
    } else {
      EventEmitter.subscribe('editor:ready', () => {
        editor.on('cursorActivity', this.onEditorCursorActivity);
      });
    }
  }

  componentWillUnmount() {
    editor.off('cursorActivity', this.onEditorCursorActivity);
  }

  onDrag(e, ui) {
    let delta = this.props.height - (ui.y);

    if (delta < this.MIN_HEIGHT) {
      delta = this.MIN_HEIGHT;
    }

    this.props.dispatch({
      type: SET_SETTINGS,
      docsPanelHeight: delta,
    });
  }

  onClickChild(address) {
    this.setState({ display: this.findMatch(address, false) });
  }

  onEditorCursorActivity(cm) {
    const doc = cm.getDoc();
    const cursor = doc.getCursor();
    const cursorIndex = doc.indexFromPos(cursor); // -> Number
    const node = parsedYAMLDocument.getNodeAtIndex(cursorIndex);
    const address = getKeyAddressForNode(node);
    this.setState({ display: this.findMatch(address, true) });
  }

  /**
   * Toggle the panel so it is visible or not visible
   */
  openPanel() {
    this.props.dispatch({
      type: SET_SETTINGS,
      docsPanelHeight: this.lastSavedHeight,
    });
  }

  closePanel() {
    this.lastSavedHeight = this.props.height;
    this.props.dispatch({
      type: SET_SETTINGS,
      docsPanelHeight: 0,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  findMatch(address, optionalBool) {
    let currentTree = TANGRAM.keys; // Initializes to the tree at level 0
    // console.log(address);
    const split = address.split(':');

    let partialAddress;
    let currentNode;
    let currentParent;
    for (let i = 0; i < split.length; i++) {
      if (currentNode !== undefined) {
        currentParent = currentNode;
      }

      // Construct a partial address for each child in the tree
      if (i === 0) {
        partialAddress = split[0];
      } else {
        partialAddress = `${partialAddress}:${split[i]}`;
      }

      // Find a match of that address within our docs JSON
      for (const node of currentTree) {
        const found = partialAddress.match(node.address);

        if (found !== null) {
          currentNode = node;
          currentTree = node.children;
          break;
        }
      }
    }

    // Adding parent node
    if (currentParent !== undefined) {
      currentNode.parent = {
        name: currentParent.name,
        description: currentParent.description,
        example: currentParent.example,
      };
    }

    // Adding original address searched (not the regex)
    if (optionalBool && currentNode) {
      currentNode.originalAddress = address;
    }

    if (currentNode) {
      return currentNode;
    }

    // Return an empty object if no currentNode
    return {};
  }

  renderChildren(node) {
    let list;

    if (node.children !== undefined) {
      list = node.children.map((value, i) => (
        <Row key={i} className="child-row">
          <Row>
            <Col sm={2} className="capitalize">name:</Col>
            <Col
              sm={10}
              onClick={() => { this.onClickChild(value.example); }}
              className="docs-link"
            >
              <code>{value.name}</code>
            </Col>
          </Row>
          <Row>
            <Col sm={2} className="capitalize">description:</Col>
            <Col sm={10}><code>{value.description}</code></Col>
          </Row>
        </Row>
      ));
    } else {
      list = null;
    }

    return list;
  }

  renderParent(node) {
    const parent = node.parent;

    const list = (
      <Row className="child-row">
        <Row>
          <Col sm={2} className="capitalize">name:</Col>
          <Col
            sm={10}
            onClick={() => { this.onClickChild(parent.example); }}
            className="docs-link"
          >
            <code>{parent.name}</code>
          </Col>
        </Row>
        <Row>
          <Col sm={2} className="capitalize">description:</Col>
          <Col sm={10}><code>{parent.description}</code></Col>
        </Row>
      </Row>
    );

    return list;
  }

  /**
   * Official React lifecycle method
   * Called every time state or props are changed
   */
  render() {
    const divStyle = {
      height: `${this.props.height}px`,
    };

    const result = this.state.display;

    return (
      <div className="docs-panel">
        {/* Toggle docs panel to show it*/}
        <IconButton
          className="docs-panel-button-show"
          icon="bt-caret-up"
          tooltip="Open docs toolbar"
          tooltipPlacement="top"
          onClick={this.openPanel}
        />

        {/* Docs panel */}
        <Draggable axis="y" onDrag={this.onDrag} handle=".docs-divider">
          <Panel className="docs-panel-collapsible" style={divStyle}>
            <div className="docs-divider"><span className="docs-divider-affordance" /></div>

            <div className="docs-panel-toolbar" >
              {/* Text within the docs panel */}
              <div className="docs-panel-toolbar-content">
                <Grid>
                  {(() => {
                    const list = Object.keys(result).map((value, i) => {
                      if (value === 'children') {
                        return (
                          <Row key={i} className="toolbar-content-row">
                            <Col sm={2} className="capitalize">{value}:</Col>
                            <Col sm={10}>{this.renderChildren(result)}</Col>
                          </Row>
                        );
                      } else if (value === 'parent') {
                        return (
                          <Row key={i} className="toolbar-content-row">
                            <Col sm={2} className="capitalize">{value}:</Col>
                            <Col sm={10}>{this.renderParent(result)}</Col>
                          </Row>
                        );
                      }

                      return (
                        <Row key={i} className="toolbar-content-row">
                          <Col sm={2} className="capitalize">{value}:</Col>
                          <Col sm={10}><code>{result[value]}</code></Col>
                        </Row>
                      );
                    });

                    return list;
                  })()}
                </Grid>
              </div>

              {/* Toggle docs panel to hide it*/}
              <ButtonGroup className="docs-panel-toolbar-toggle">
                <IconButton
                  icon="bt-caret-down"
                  tooltip="Close docs toolbar"
                  onClick={this.closePanel}
                />
              </ButtonGroup>

            </div>
          </Panel>
        </Draggable>
      </div>
    );
  }
}

DocsPanel.propTypes = {
  dispatch: React.PropTypes.func,
  height: React.PropTypes.number,
};

DocsPanel.defaultProps = {
  height: INITIAL_HEIGHT,
};

function mapStateToProps(state) {
  return {
    height: state.settings.docsPanelHeight,
  };
}

export default connect(mapStateToProps)(DocsPanel);
