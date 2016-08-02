import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import DraggableModal from '../../draggable-modal.react.js';
import Icon from '../../Icon';
import { setCodeMirrorValue } from '../../../editor/editor';

import THREE from 'three';
import TrackballControls from './TrackballControls';

let renderer;
let scene;
let camera;
let controls;

/**
 * Represents a dropdown widget
 */
export default class WidgetVector extends React.Component {
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
            displayPicker: false,
        };

        this.bookmark = this.props.bookmark;

        this.handleClick = this.handleClick.bind(this);
        this.animate = this.animate.bind(this);
    }

    componentDidUpdate () {
        if (window.WebGLRenderingContext) {
            renderer = new THREE.WebGLRenderer({ antialias: true });
            this.refs.mytest.appendChild(renderer.domElement);

            renderer.setSize(300, 300);
            renderer.setClearColor(0xeeeeee, 1.0);

            scene = new THREE.Scene();

            let meshMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF, wireframe: true });

            var cube = new THREE.Mesh(new THREE.CubeGeometry(5, 5, 5), meshMaterial);
            cube.position.set(25, 25, 25);
            scene.add(cube);

            // Add axes
            let axes = this.buildAxes(1000);
            scene.add(axes);

            camera = new THREE.PerspectiveCamera(45, 300 / 300, 1, 10000);
            camera.position.set(30, 50, 120);
            camera.lookAt(new THREE.Vector3(0, 0, 0));

            controls = new TrackballControls(camera, renderer.domElement);
            controls.rotateSpeed = 1.0;
            controls.zoomSpeed = 0.2;
            controls.panSpeed = 0.8;

            controls.noZoom = false;
            controls.noPan = false;

            controls.staticMoving = true;
            controls.dynamicDampingFactor = 0.3;

            let lineToMove = this.buildLine();
            scene.add(lineToMove);

            this.animate();
        }
    }

    animate () {
        requestAnimationFrame(this.animate);
        controls.update();
        renderer.render(scene, camera);
    }

    buildLine () {
        let mat = new THREE.LineBasicMaterial({
            linewidth: 5,
            color: 0xFF99FF,
            linecap: 'butt',
            linejoin: 'bevel'
        });

        let geom = new THREE.Geometry();
        let line3 = new THREE.Line3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(80, 80, 80));

        // geom.vertices.push(new THREE.Vector3(0, 0, 0));
        // geom.vertices.push(new THREE.Vector3(80, 80, 80));
        geom.vertices.push(line3.start);
        geom.vertices.push(line3.end);

        let line = new THREE.Line(geom, mat);

        return line;
    }

    buildAxes (length) {
        let axes = new THREE.Object3D();

        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x00FF00, false)); // +Y
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x00FF00, true)); // -Y
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z

        return axes;
    }

    buildAxis (src, dst, colorHex, dashed) {
        let geom = new THREE.Geometry();
        let mat;

        if (dashed) {
            mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
        }
        else {
            mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
        }

        geom.vertices.push(src.clone());
        geom.vertices.push(dst.clone());
        geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        // let axis = new THREE.Line(geom, mat, THREE.LinePieces);
        // http://stackoverflow.com/questions/32915473/three-js-r72-no-longer-supports-three-linepieces-how-to-merge-multiple-disconne
        // let axis = new THREE.Line(geom, mat, THREE.LineSegments);

        // let test = new THREE.LineSegments(geom, mat);
        let axis = new THREE.Line(geom, mat);

        return axis;
    }

    /**
     * Open or close the color picker widget
     */
    handleClick () {
        this.setState({ displayPicker: !this.state.displayPicker });
    }

    /* SHARED METHODS FOR ALL WIDGETS? */
    /**
     *  Use this method within a widget to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue (string) {
        this.bookmark = setCodeMirrorValue(this.bookmark, string);
    }

    render () {
        return (
            <div>
                {/* The widget button user clicks to open color picker */}
                <div className='widget widget-vectorpicker' onClick={ this.handleClick }></div>

                {/* Draggable modal */}
                <Modal id='modal-test' dialogComponentClass={DraggableModal} enforceFocus={false} className='widget-modal' show={this.state.displayPicker} onHide={this.handleClick}>
                    <div className='drag'>
                        <Button onClick={ this.handleClick } className='widget-exit'><Icon type={'bt-times'} /></Button>
                    </div>
                    {/* The actual color picker */}
                    <div ref='mytest'></div>
                </Modal>
            </div>
       );
    }
}

/**
 * Prop validation required by React
 */
WidgetVector.propTypes = {
    bookmark: React.PropTypes.object
};
