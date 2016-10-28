import THREE from 'three';
import React from 'react';

import FloatingPanel from '../../FloatingPanel';
import TrackballControls from './TrackballControls';
import { setCodeMirrorValue } from '../../../editor/editor';

let renderer;
let scene;
let camera;
let controls;

/**
 * Represents a vector picker and editor bookmark to trigger this
 */
export default class VectorPicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            displayPicker: false,
        };

        this.bookmark = this.props.bookmark;

        this.onClickBookmark = this.onClickBookmark.bind(this);
        this.animate = this.animate.bind(this);
    }

    componentDidUpdate() {
        if (window.WebGLRenderingContext) {
            renderer = new THREE.WebGLRenderer({ antialias: true });
            this.vectorPicker.appendChild(renderer.domElement);

            renderer.setSize(300, 300);
            renderer.setClearColor(0xeeeeee, 1.0);

            scene = new THREE.Scene();

            const meshMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF, wireframe: true });

            const cube = new THREE.Mesh(new THREE.CubeGeometry(5, 5, 5), meshMaterial);
            cube.position.set(25, 25, 25);
            scene.add(cube);

            // Add axes
            const axes = this.buildAxes(1000);
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

            const lineToMove = this.buildLine();
            scene.add(lineToMove);

            this.animate();
        }
    }

    /**
     * Open or close the vector picker
     */
    onClickBookmark() {
        this.setState({ displayPicker: !this.state.displayPicker });
    }

    /* SHARED METHOD FOR ALL PICKERS? */
    /**
     *  Use this method within a picker to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue(string) {
        this.bookmark = setCodeMirrorValue(this.bookmark, string);
    }

    animate() {
        requestAnimationFrame(this.animate);
        controls.update();
        renderer.render(scene, camera);
    }

    buildLine() {
        const mat = new THREE.LineBasicMaterial({
            linewidth: 5,
            color: 0xFF99FF,
            linecap: 'butt',
            linejoin: 'bevel',
        });

        const geom = new THREE.Geometry();
        const line3 = new THREE.Line3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(80, 80, 80));

        // geom.vertices.push(new THREE.Vector3(0, 0, 0));
        // geom.vertices.push(new THREE.Vector3(80, 80, 80));
        geom.vertices.push(line3.start);
        geom.vertices.push(line3.end);

        const line = new THREE.Line(geom, mat);

        return line;
    }

    buildAxes(length) {
        const axes = new THREE.Object3D();

        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x00FF00, false)); // +Y
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x00FF00, true)); // -Y
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z

        return axes;
    }

    buildAxis(src, dst, colorHex, dashed) {
        const geom = new THREE.Geometry();
        let mat;

        if (dashed) {
            mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
        } else {
            mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
        }

        geom.vertices.push(src.clone());
        geom.vertices.push(dst.clone());
        // This one is SUPER important, otherwise dashed lines will appear as simple plain lines
        geom.computeLineDistances();

        // let axis = new THREE.Line(geom, mat, THREE.LinePieces);
        // http://stackoverflow.com/questions/32915473/three-js-r72-no-longer-supports-three-linepieces-how-to-merge-multiple-disconne
        // let axis = new THREE.Line(geom, mat, THREE.LineSegments);

        // let test = new THREE.LineSegments(geom, mat);
        const axis = new THREE.Line(geom, mat);

        return axis;
    }

    render() {
        return (
            <div>
                {/* The button user clicks to open the vector picker */}
                <div className="bookmark bookmark-vectorpicker" onClick={this.onClickBookmark} />

                {/* Floating panel */}
                <FloatingPanel
                    x={this.x}
                    y={this.y}
                    width={this.width}
                    height={this.height}
                    show={this.state.displayPicker}
                    onClickClose={this.onClickBookmark}
                >
                    <div ref={(ref) => { this.vectorPicker = ref; }} />
                </FloatingPanel>
            </div>
       );
    }
}

/**
 * Prop validation required by React
 */
VectorPicker.propTypes = {
    bookmark: React.PropTypes.object,
};
