import React from 'react';

export default class MapPanelZoomIndicator extends React.PureComponent {
    formatZoom(zoom) {
        const fractionalNumber = Math.floor(zoom * 10) / 10;
        return Number.parseFloat(fractionalNumber).toFixed(1);
    }

    render() {
        return (
            <div className="map-panel-zoom">
                z{this.formatZoom(this.props.zoom)}
            </div>
        );
    }
}

MapPanelZoomIndicator.propTypes = {
    zoom: React.PropTypes.number,
};
