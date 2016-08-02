import React from 'react';
import ReactDOM from 'react-dom';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import NavItem from 'react-bootstrap/lib/NavItem';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import Icon from './Icon';
import SignInModal from '../modals/SignInModal';
import ErrorModal from '../modals/ErrorModal';

import { EventEmitter } from './event-emitter';
import { getUserLogin } from '../user/login';
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
        ReactDOM.render(<SignInModal />, document.getElementById('modal-container'));
    }

    /**
     * Signs out of mapzen.com. Check state of editor first to make sure that
     * the user is ready to navigate away.
     */
    onClickSignOut (event) {
        EditorIO.checkSaveStateThen(() => {
            window.fetch('/api/developer/sign_out', {
                method: 'POST',
                credentials: 'same-origin'
            }).then((response) => {
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
        getUserLogin().then((data) => {
            const newState = {
                serverContacted: true
            };

            // If a user is not logged in, data object is empty.
            if (data.id) {
                newState.isLoggedIn = true;
                newState.nickname = data.nickname || null;
                newState.avatar = data.avatar || null;
            }

            this.setState(newState);
        });
    }

    render () {
        if (this.state.isLoggedIn) {
            return (
                <OverlayTrigger
                    rootClose
                    placement='bottom'
                    overlay={<Tooltip id='tooltip'>{'Sign out'}</Tooltip>}
                >
                    <NavItem onClick={this.onClickSignOut} href='#' className='menu-sign-in'>
                        <img src={this.state.avatar} className='sign-in-avatar' alt={this.state.nickname} />
                        {this.state.nickname} <Icon type={'bt-sign-out'} />
                    </NavItem>
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
