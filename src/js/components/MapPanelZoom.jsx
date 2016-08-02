import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';
import MapPanelZoomIndicator from './MapPanelZoomIndicator';
import { map } from '../map/map';

export default class MapPanelZoom extends React.Component {
    /**
     * Used to setup the state of the component. Regular ES6 classes do not
     * automatically bind 'this' to the instance, therefore this is the best
     * place to bind event handlers
     *
     * @param props - parameters passed from the parent
     */
    constructor (props) {
        super(props);

        this.state = {
            zoom: map.getZoom() // Current map zoom position to display
        };

        this.onClickZoomIn = this.onClickZoomIn.bind(this);
        this.onClickZoomOut = this.onClickZoomOut.bind(this);
    }

    /** Zoom functionality **/

    /**
     * Zoom into the map when user click ZoomIn button
     */
    onClickZoomIn () {
        map.zoomIn(1, { animate: true });
        this.setState({ zoom: map.getZoom() });
    }

    /**
     * Zoom into the map when user click ZoomOut button
     */
    onClickZoomOut () {
        map.zoomOut(1, { animate: true });
        this.setState({ zoom: map.getZoom() });
    }

    render () {
        return (
            <div className='map-panel-zoom-container'>
                <MapPanelZoomIndicator zoom={this.state.zoom} />

                {/* Zoom buttons */}
                <ButtonGroup className='buttons-plusminus'>
                    <OverlayTrigger
                        rootClose
                        placement='bottom'
                        overlay={<Tooltip id='tooltip'>{'Zoom in'}</Tooltip>}
                    >
                        <Button onClick={this.onClickZoomIn} className='map-panel-zoomin'>
                            <Icon type={'bt-plus'} />
                        </Button>
                    </OverlayTrigger>

                    <OverlayTrigger
                        rootClose
                        placement='bottom'
                        overlay={<Tooltip id='tooltip'>{'Zoom out'}</Tooltip>}
                    >
                        <Button onClick={this.onClickZoomOut}>
                            <Icon type={'bt-minus'} />
                        </Button>
                    </OverlayTrigger>
                </ButtonGroup>
            </div>
        );
    }
}
