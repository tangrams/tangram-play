import React from 'react';
import { connect } from 'react-redux';

class Shield extends React.PureComponent {
    render() {
        const displayStyle = this.props.visible
            ? { display: 'block' }
            : { display: 'none' };

        return <div className="shield" style={displayStyle} />;
    }
}

Shield.propTypes = {
    visible: React.PropTypes.bool,
};

Shield.defaultProps = {
    visible: false,
};

function mapStateToProps(state) {
    return {
        visible: state.shield.visible,
    };
}

const ShieldContainer = connect(mapStateToProps)(Shield);

export default ShieldContainer;
