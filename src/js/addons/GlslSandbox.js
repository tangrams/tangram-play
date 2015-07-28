import { fetchHTTP, debounce, getPosition, toCSS } from '../core/common.js';
import { isEmpty } from '../core/codemirror/tools.js';
import { isNormalBlock, isColorBlock, getAddressSceneContent, getKeysFromAddress, getAddressFromKeys } from '../core/codemirror/yaml-tangram.js';

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// Debounced event after user stop doing something
var stopAction = debounce(function(cm) {
    if (cm.glsl_sandbox.active) {
        cm.glsl_sandbox.cursorMove();
    }
}, 1000);

export default class GlslSandbox {
    constructor (tangram_play, configFile ) {

    	//  Make link to this manager inside codemirror obj to be excecuted from CM events
        tangram_play.editor.glsl_sandbox = this;

        // Constant OBJ
        this.tangram_play = tangram_play;
        this.sandbox = undefined;
        this.element = document.createElement('div');
        this.element.id = 'tp-a-sandbox';
        this.element.setAttribute("width","130");
        this.element.setAttribute("height","130");

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'tp-a-sandbox-canvas';
        this.canvas.className = 'glsl_sandbox';
        this.canvas.setAttribute("width","130");
        this.canvas.setAttribute("height","130");
        this.canvas.setAttribute("data-fragment",'precision mediump float;\nvarying vec2 v_texcoord;void main() {\ngl_FragColor = vec4(v_texcoord.x,v_texcoord.y,1.0,1.0);\n}');
        this.element.appendChild(this.canvas);

        this.colorPicker = document.createElement('div');
        this.colorPicker.addEventListener('click', this.onClick.bind(this));
        this.colorPicker.id = 'tp-a-sandbox-colorpicker';
        this.element.appendChild(this.colorPicker);

        // VARIABLES
        this.active = false;
        this.line = -1;
        this.address = "";
        this.animated = false;
        this.uniforms = {};

        // Tangram uniforms
        this.color = "rgb(0,255,0)"
        this.setColor( [0,1,0,1] );
        this.uniforms.u_device_pixel_ratio = window.devicePixelRatio;
        this.uniforms.u_meters_per_pixel = 1;
        this.uniforms.u_map_position = [0,0,0];
        this.uniforms.u_tile_origin = [0,0,0];
        this.uniforms.u_vanishing_point = 1;

        // EVENTS
        tangram_play.editor.on("cursorActivity", function(cm) {
            cm.glsl_sandbox.cursorMove();
        });

        tangram_play.editor.on("changes", function(cm, changesObj) {
            stopAction(cm);
        });
    }

    reload(nLine) {
        if (nLine === undefined) {
            nLine = this.tangram_play.editor.getCursor().line;
        }

        if (!isEmpty(this.tangram_play.editor,nLine)) {
            let keys = this.tangram_play.getKeysOnLine(nLine);
            if (keys && keys[0]){

                this.address = keys[0].address;
                let isNormal = isNormalBlock(this.address);
                let isColor = isColorBlock(this.address);

                if (isNormal || isColor) {
                    // Store address and states
                    this.styleObj = getStyleObj(this.tangram_play.scene, this.address);

                    if (this.styleObj===undefined || this.styleObj.shaders === undefined) { this.disable(); return; }

                    //  Start sandbox and inject widget
                    if (this.sandbox === undefined) this.sandbox = new GlslCanvas(this.canvas);
                    this.tangram_play.editor.addWidget({line: nLine, ch: 0}, this.element);

                    // Load block data
                    if (this.styleObj.material) {   // Materials
                        for (let el in this.styleObj.material) {
                            if (!Array.isArray(this.styleObj.material[el]) && this.styleObj.material[el].texture ){
                                this.uniforms["u_material_"+el+"_texture"] = this.styleObj.material[el].texture;
                                this.uniforms["u_material."+el+"Scale"] = this.styleObj.material[el].scale;
                            }
                        }
                    }

                    //  Update data
                    this.update();

                    // Common HEADER
                    this.vertexCode = getVertex(this.tangram_play.scene, this.sandbox.uniforms, this.styleObj);
                    this.fragmentCode = getFramgmentHeader(this.tangram_play.scene, this.sandbox.uniforms, this.styleObj);

                    if (isNormal) {
                        // NORMAL CORE & ENDING
                        this.fragmentCode += getAddressSceneContent(this.tangram_play.scene, this.address) +
                                        "\ngl_FragColor = vec4(normal,1.0);\n}";        
                    } else if (isColor) {
                        // COLOR CORE & ENDING
                        this.fragmentCode += "\n";
                        if ( this.styleObj.shaders.blocks && this.styleObj.shaders.blocks.normal) {
                            for (let i = 0; i < this.styleObj.shaders.blocks.normal.length; i++){
                                this.fragmentCode += this.styleObj.shaders.blocks.normal[i] + "\n";
                            }
                        }
                        this.fragmentCode += getAddressSceneContent(this.tangram_play.scene, this.address) +
                                        "\ngl_FragColor = color;\n}";   
                    }

                    // Load load composed shader code
                    this.sandbox.load(this.fragmentCode, this.vertexCode);          

                    this.start();
                } else {
                    this.disable();
                }
            }
        } else {
            this.disable();
        }
    }

    start() {
        if (!this.active) {
            this.active = true;
            this.render();
        }
    }

    stop() {
        this.active = false;
    }

    disable() {
        if (this.active) {
            this.element.parentNode.removeChild(this.element);
        }
        this.stop();
        this.address = "";
    }

    update() {
        // Update uniforms
        this.uniforms.u_device_pixel_ratio = window.devicePixelRatio;
        this.uniforms.u_meters_per_pixel = this.tangram_play.scene.meters_per_pixel;
        this.uniforms.u_map_position = [this.tangram_play.scene.center_meters.x, this.tangram_play.scene.center_meters.y, this.tangram_play.scene.zoom];
        this.uniforms.u_tile_origin = [this.tangram_play.scene.center_tile.x, this.tangram_play.scene.center_tile.y, this.tangram_play.scene.center_tile.z];
        this.uniforms.u_vanishing_point = this.tangram_play.scene.camera.vanishing_point;

        this.sandbox.setUniforms(this.uniforms);
    }

    render() {
    	if (this.active) { // && this.animated) {
            this.update();
			this.sandbox.render();
			requestAnimationFrame(function(){
				tangramPlay.editor.glsl_sandbox.render();
			}, 1000 / 30);
    	}
    }

    /**
     *  Handles when user clicks on the in-line color indicator widget
     */
    onClick (event) {
        let pos = getPosition(this.color);
        pos.x += 20;
        pos.y = this.tangram_play.editor.heightAtLine( this.line )-16;

        this.picker = new ColorPickerModal(this.uniforms.u_color);

        this.picker.presentModal(pos.x,pos.y);
        this.picker.on('changed', this.onPickerChange.bind(this));
    }

    /**
     *  Handles when user selects a new color on the colorpicker
     */
    onPickerChange (event) {
        // console.log(this.picker);
        // console.log(this.picker.color);
        // let match = this.picker.color.match(/\[\s*(\d|\d*\.?\d+)\s*,\s*(\d|\d*\.?\d+)\s*,\s*(\d|\d*\.?\d+)\s*,\s*(\d|\d*\.?\d+)\s*\]/);
        // console.log(match);

        // this.setColor( [match[1],match[2],match[3],1] );

        let color = this.picker.getRGB();
        console.log(color);
        this.setColor( [color.r,color.g,color.b,1] );
    }

    setColor(colorArray) {
        if (typeof colorArray === "number") {
            this.uniforms.u_color = [colorArray,colorArray,colorArray,1];
        } else if (colorArray.length === 1){
             this.uniforms.u_color = [colorArray[0],colorArray[0],colorArray[0],1];
        } else if (colorArray.length === 3){
             this.uniforms.u_color = [colorArray[0],colorArray[1],colorArray[2],1];
        } else if (colorArray.length === 4){
             this.uniforms.u_color = colorArray;
        }
        let rgbString = 'rgb('+ Math.round(this.uniforms.u_color[1]*255)+","+
                                Math.round(this.uniforms.u_color[2]*255)+","+
                                Math.round(this.uniforms.u_color[3]*255)+")";
        this.colorPicker.style.backgroundColor = rgbString;
        console.log("SetColor ", rgbString);
        this.color = rgbString;
    }

    cursorMove() {
        let pos = this.tangram_play.editor.getCursor();

        let edge = this.tangram_play.editor.charCoords({line:pos.line, ch:20}).left;
        let left = this.tangram_play.editor.charCoords(pos).left;

        if (pos.ch < 20 || left < edge) {
            if (this.active) {
                this.disable();
            }
        } else if (pos.line !== this.line || !this.active) {
            this.line = pos.line;
            this.reload(pos.line);
        }
    }
}

function getNumberOfOpenParentesis(str) {
    let counter = 0;
    for (let i = 0; i < str.length; i++){
        if ( str[i] === "{" ){
            counter++;
        } else if ( str[i] === "}" ){
            counter--;
        }
    }
    return counter;
};

function getStyleObj(sc, address) {
    let keys = getKeysFromAddress(address);
    if (keys === undefined || keys.length === 0) {
        console.log("Error: no Style on: ", address );
        return {};
    }
    return sc.styles[keys[1]];
}

function getVertex(scene, uniforms, styleObj) {
    let block_uniforms = `
#ifdef GL_ES
precision mediump float;
#endif

vec3 u_eye = vec3(1.0);

attribute vec3 a_position;
// attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec3 v_normal;
varying vec4 v_color;
varying vec4 v_world_position;

#ifdef TANGRAM_TEXTURE_COORDS
    // varying vec2 v_texcoord;
#endif

`
    for (let u in uniforms) {
        block_uniforms += "uniform " + uniforms[u].type + " " + uniforms[u].name + ";\n";
    }

    let block_global = "\n";
    if (styleObj.shaders.blocks.global) {
        for (let i = 0; i < styleObj.shaders.blocks.global.length; i++){
            block_global += styleObj.shaders.blocks.global[i] + "\n";
        }
    }
            
    let core = `
void main() {
    gl_Position = vec4(a_position.xy, 0.0, 1.0);
    vec4 position = vec4(a_position.xy, 0.0, 1.0);

    #ifdef TANGRAM_TEXTURE_COORDS
    v_texcoord = a_position.xy*.5+.5;// a_texcoord.xy;
    #endif

    v_world_position = vec4(u_map_position*0.001,1.);
    v_world_position.xy += (position.xy*u_meters_per_pixel)*100.;
 `;

    let block_position = "\n";
    if (styleObj.shaders.blocks.position) {
        for (let i = 0; i < styleObj.shaders.blocks.position.length; i++){
            block_position += styleObj.shaders.blocks.position[i] + "\n";
        }
    }

    let ending = `
    v_position = position;
    v_normal = vec3(0.,0.,1.);
    v_color = u_color;
}
`;

    return block_uniforms + block_global + core + block_position + ending;
}

function getFramgmentHeader(scene, uniforms, styleObj) {

    let defines = "\n";
    for(let name in styleObj.defines){
        if (styleObj.defines[name]) {
            defines += "#define " + name + (styleObj.defines[name] === true ? "\n" : " " + styleObj.defines[name] + "\n");
        }
    }

    let block_material = "\n";
    if (styleObj.shaders.blocks.material) {
        for (let i = 0; i < styleObj.shaders.blocks.material.length; i++){
            block_material += styleObj.shaders.blocks.material[i] + "\n";
        }
    }

    let block_uniforms = `
#ifdef GL_ES
precision mediump float;
#endif

vec3 u_eye = vec3(1.0);

varying vec4 v_position;
varying vec3 v_normal;
varying vec4 v_color;
varying vec4 v_world_position;

#ifdef TANGRAM_TEXTURE_COORDS
    // varying vec2 v_texcoord;
#endif

`
    for (let u in uniforms) {
        block_uniforms += "uniform " + uniforms[u].type + " " + uniforms[u].name + ";\n";
    }

    let block_global = "\n";
    if (styleObj.shaders.blocks.global) {
        for (let i = 0; i < styleObj.shaders.blocks.global.length; i++){
            block_global += styleObj.shaders.blocks.global[i] + "\n";
        }
    }

    let pre = `
void main() {
    vec4 color = v_color;
    vec3 normal = v_normal;            
`;

    return defines + block_uniforms + block_material + block_global + pre;
}

function getBlockUntilLine(tangram_play, address, nLine) {
    let from = tangram_play.getKeyForAddress(address).pos.line+1;
    let to = nLine+1;

    let block = "\n";
    for (let i = from; i < to; i++) {
        block += tangram_play.editor.getLine(i);
    }

    let nP = getNumberOfOpenParentesis(block);
    for (let i = 0; i < nP; i++) {
        block += "}\n";
    }
    return block;
}