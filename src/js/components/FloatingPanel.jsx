import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import DraggableModal from './DraggableModal';
import PanelCloseButton from './PanelCloseButton';

export default class FloatingPanel extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            x: this.props.x,
            y: this.props.y
        };

        this.recalculatePosition = this.recalculatePosition.bind(this);
    }

    componentWillMount () {
        this.recalculatePosition();
    }

    /**
     * The panel is provided, via props, an `x`, `y`, `width` and `height`
     * values. `x` and `y` are the positions to display the upper left corner
     * of the panel. However, we want to make sure that the panel does not
     * appear outside of the viewport. This function takes into account the
     * panels' `width` and `height` values and ensures that `x` and `y` is
     * recalculated to keep the panel inside the viewport.
     */
    componentWillReceiveProps (nextProps) {
        this.setState({
            x: nextProps.x,
            y: nextProps.y,
        });

        this.recalculatePosition();
    }

    recalculatePosition () {
        // Magic number: a vertical distance in pixels to offset from the
        // provided Y value to give it a little bit of breathing room.
        const VERTICAL_POSITION_BUFFER = 5;

        const workspaceEl = document.getElementsByClassName('workspace-container')[0];
        const workspaceBounds = workspaceEl.getBoundingClientRect();

        const width = this.props.width;
        const height = this.props.height;

        let posX = this.props.x;
        let posY = this.props.y + VERTICAL_POSITION_BUFFER;

        // Prevent positions from going negative
        posX = Math.max(posX, 0);
        posY = Math.max(posY, 0);

        // Calculate maximum position values
        const maxX = posX + width;
        const maxY = posY + height;

        // Check if the widget would render outside of the workspace container area
        if (maxX > workspaceBounds.width) {
            posX = workspaceBounds.width - width;
        }
        if (maxY > workspaceBounds.height) {
            posY = workspaceBounds.height - height;
        }

        this.setState({
            x: posX,
            y: posY
        });
    }

    render () {
        return (
            <Modal
                dialogComponentClass={DraggableModal}
                className='widget-modal'
                enforceFocus={false}
                show={this.props.show}
                onHide={this.props.onHide}
                x={this.state.x}
                y={this.state.y}
            >
                <div className='drag'>
                    <PanelCloseButton onClick={this.props.onHide} />
                </div>
                {this.props.children}
            </Modal>
        );
    }
}

FloatingPanel.propTypes = {
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
    show: React.PropTypes.bool,
    onHide: React.PropTypes.func,
    children: React.PropTypes.node
};
