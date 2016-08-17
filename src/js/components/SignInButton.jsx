import React from 'react';
import ReactDOM from 'react-dom';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';
import ErrorModal from '../modals/ErrorModal';

import { EventEmitter } from './event-emitter';
import { requestUserLogin, requestUserLogout } from '../user/login';
import { openLoginWindow } from '../user/login-window';
import EditorIO from '../editor/io';

export default class SignInButton extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            serverContacted: false,
            isLoggedIn: false,
            nickname: null,
            avatar: null
        };

        this.onClickSignIn = this.onClickSignIn.bind(this);
        this.onClickSignOut = this.onClickSignOut.bind(this);
        this.checkLoggedInState = this.checkLoggedInState.bind(this);
    }

    componentDidMount () {
        this.checkLoggedInState();

        EventEmitter.subscribe('mapzen:sign_in', this.checkLoggedInState);
    }

    onClickSignIn (event) {
        openLoginWindow();
    }

    /**
     * Signs out of mapzen.com. Check state of editor first to make sure that
     * the user is ready to navigate away.
     */
    onClickSignOut (event) {
        EditorIO.checkSaveStateThen(() => {
            requestUserLogout().then((response) => {
                if (response.ok) {
                    this.setState({
                        isLoggedIn: false,
                        nickname: null,
                        avatar: null
                    });
                }
                else {
                    ReactDOM.render(<ErrorModal error='Unable to sign you out.' />, document.getElementById('modal-container'));
                    console.log(response);
                }
            });
        });
    }

    checkLoggedInState () {
        requestUserLogin().then((data) => {
            const newState = {
                serverContacted: true
            };

            // If a user is not logged in, data object is empty.
            if (data.id) {
                newState.isLoggedIn = true;
                newState.nickname = data.nickname || null;
                newState.avatar = data.avatar || null;
            }

            // If this is a self-hosted (or localhost) instance of Tangram Play
            // (e.g. not on mapzen.com) then there is no login functionality
            // and we effectively disable it
            if (data.hosted === false) {
                newState.serverContacted = false;
            }

            this.setState(newState);
        });
    }

    // Note on wording:
    //   >  You "sign in" or "sign off" when accessing an account.
    //   >  You "log on" or "log out" of a operating system session.
    // https://github.com/mapzen/styleguide/blob/master/src/site/guides/common-terms-and-conventions.md
    render () {
        if (this.state.isLoggedIn) {
            return (
                <OverlayTrigger
                    rootClose
                    placement='bottom'
                    overlay={<Tooltip id='tooltip'>{'This is you!'}</Tooltip>}
                >
                    <NavDropdown
                        title={<span><img src={this.state.avatar} className='sign-in-avatar' alt={this.state.nickname} /> {this.state.nickname}</span>}
                        className='menu-sign-in'
                    >
                        <MenuItem onClick={this.onClickSignOut}>
                            <Icon type={'bt-sign-out'} /> Sign out
                        </MenuItem>
                    </NavDropdown>
                </OverlayTrigger>
            );
        }
        // Logged out state. Only display if server is contacted and has confirmed
        // no user is logged in. This is to prevent this button from having a
        // "Sign in" momentarily flash before the login-state API is contacted.
        else if (this.state.serverContacted && !this.state.isLoggedIn) {
            return (
                <NavItem onClick={this.onClickSignIn} href='#' className='menu-sign-in'>
                    Sign in <Icon type={'bt-sign-in'} />
                </NavItem>
            );
        }
        else {
            return null;
        }
    }
}
