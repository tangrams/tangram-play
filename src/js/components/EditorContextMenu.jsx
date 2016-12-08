import React from 'react';

export default class EditorContextMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      display: true,
    };
  }

  render() {
    return (
      <div className="editor-context-menu">
        <div className="editor-context-menu-section">
          <ul>
            <li>Open in new tab</li>
          </ul>
        </div>
      </div>
    );
  }
}
