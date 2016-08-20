import React from 'react';
import { initDivider } from '../ui/divider';

export default class Editor extends React.Component {
    componentDidMount () {
        initDivider();
    }

    render () {
        return (
            <div className='divider' id='divider'>
                <span className='divider-affordance' />
            </div>
        );
    }
}
