import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';
import ErrorModal from '../modals/ErrorModal';

import EventEmitter from './event-emitter';
import { requestUserSignInState, requestUserSignOut } from '../user/sign-in';
import { openSignInWindow } from '../user/sign-in-window';
import EditorIO from '../editor/io';

import { USER_SIGNED_IN, USER_SIGNED_OUT } from '../store/actions';
// This is not exported. It will be connected to a Redux container component
// which _is_ exported.
class SignInButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            serverContacted: false,
        };

        this.onClickSignIn = this.onClickSignIn.bind(this);
        this.onClickSignOut = this.onClickSignOut.bind(this);
        this.checkLoggedInState = this.checkLoggedInState.bind(this);
    }

    componentDidMount() {
        this.checkLoggedInState();

        EventEmitter.subscribe('mapzen:sign_in', this.checkLoggedInState);
    }

    onClickSignIn(event) {
        openSignInWindow();
    }

    /**
     * Signs out of mapzen.com. Check state of editor first to make sure that
     * the user is ready to navigate away.
     */
    onClickSignOut(event) {
        EditorIO.checkSaveStateThen(() => {
            requestUserSignOut()
                .then(() => {
                    this.props.dispatch({ type: USER_SIGNED_OUT });
                })
                .catch(error => {
                    ReactDOM.render(
                        <ErrorModal error="Unable to sign you out." />,
                        document.getElementById('modal-container')
                    );
                });
        });
    }

    checkLoggedInState() {
        requestUserSignInState().then(data => {
            // This tells us we've contacted mapzen.com and the API is valid
            // `data` is null if we are not hosted in the right place
            if (data) {

                this.props.dispatch({
                    type: USER_SIGNED_IN,
                    nickname: data.nickname,
                    email: data.email,
                    avatar: data.avatar,
                    admin: data.admin,
                });

                this.setState({ serverContacted: true });
            }
        });
    }

    // Note on wording:
    //   >  You "sign in" or "sign off" when accessing an account.
    //   >  You "log on" or "log out" of a operating system session.
    // https://github.com/mapzen/styleguide/blob/master/src/site/guides/common-terms-and-conventions.md
    render() {
        if (this.props.nickname) {
            const ButtonContents = (
                <span>
                    <img
                        src={this.props.avatar}
                        className="sign-in-avatar"
                        alt={this.props.nickname}
                    />
                    {this.props.nickname}
                    {(() => {
                        if (this.props.admin === true) {
                            return (<span className="sign-in-admin-star">★</span>);
                        }
                        return null;
                    })()}
                </span>
            );

            let tooltipContents = 'This is you!';
            if (this.props.admin === true) {
                tooltipContents = 'You are a Mapzen admin.';
            }

            return (
                <OverlayTrigger
                    rootClose
                    placement="bottom"
                    overlay={<Tooltip id="tooltip">{tooltipContents}</Tooltip>}
                >
                    <NavDropdown
                        title={ButtonContents}
                        className="menu-sign-in"
                    >
                        <MenuItem onClick={this.onClickSignOut}>
                            <Icon type="bt-sign-out" /> Sign out
                        </MenuItem>
                    </NavDropdown>
                </OverlayTrigger>
            );
        } else if (this.state.serverContacted && !this.props.nickname) {
            // Logged out state. Only display if server is contacted and has confirmed
            // no user is logged in. This is to prevent this button from having a
            // "Sign in" momentarily flash before the sign-in-state API is contacted.
            return (
                <NavItem onClick={this.onClickSignIn} href="#" className="menu-sign-in">
                    Sign in <Icon type="bt-sign-in" />
                </NavItem>
            );
        }

        return null;
    }
}

SignInButton.propTypes = {
    nickname: React.PropTypes.string,
    avatar: React.PropTypes.string,
    admin: React.PropTypes.bool,
};

SignInButton.defaultProps = {
    nickname: '',
    avatar: '',
    admin: false,
};

function mapStateToProps(state) {
    return {
        nickname: state.user.nickname,
        avatar: state.user.avatar,
        admin: state.user.admin,
    };
}

const SignInButtonContainer = connect(mapStateToProps)(SignInButton);

export default SignInButtonContainer;
