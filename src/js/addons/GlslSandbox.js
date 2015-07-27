import { fetchHTTP, debounce, getPosition } from '../core/common.js';
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
    cm.widgets_manager.rebuild();
    if (cm.glsl_sandbox.active) {
        cm.glsl_sandbox.update_changes(cm.getCursor().line);
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
        this.canvas.setAttribute("data-fragment","void main() {\ngl_FragColor = vec4(1.0,0.0,1.0,1.0);\n}");
        this.element.appendChild(this.canvas);

        let el = document.createElement('div');
        el.id = 'tp-a-sandbox-colorpicker';
        el.style.background = '#FF0000';
        el.addEventListener('click', function (e) {
            let picker = new thistle.Picker(el.style.background);
            let pos = getPosition(el);
            
            picker.presentModal(pos.x+20,
                                tangram_play.editor.heightAtLine( tangram_play.editor.glsl_sandbox.line )-16);

            picker.on('changed', function() {
                el.style.background = picker.getCSS();
                let color = picker.getRGB();
                tangram_play.editor.tangram_play.addons.glsl_sandbox.setColor([color.r,color.g,color.b]);
            });
        });
        this.element.appendChild(el);

        // VARIABLES
        this.active = false;
        this.line = -1;
        this.address = "";
        this.animated = false;
        this.uniforms = {};
        this.uniforms.u_color = [1,0,0];

        // EVENTS
        tangram_play.editor.on("cursorActivity", function(cm) {
            cm.glsl_sandbox.update();
        });

        tangram_play.editor.on("changes", function(cm, changesObj) {
            stopAction(cm);
        });
    }

    setColor(colorArray) {
        this.uniforms.u_color = colorArray;
    }

    disable() {
        if (this.active) {
            this.element.parentNode.removeChild(this.element);
        }
        this.active = false;
        this.address = "";
    }

    update() {
    	let pos = this.tangram_play.editor.getCursor();
        if (pos.ch < 16) {
            if (this.active) {
                this.disable();
            }
        } else if (pos.line !== this.line) {
    		this.line = pos.line;
    		this.update_changes(pos.line);
    	}
    }

    update_changes(nLine) {

        if (!isEmpty(this.tangram_play.editor,nLine)){
            let keys = this.tangram_play.getKeysOnLine(nLine);
            if (keys && keys[0]){
                this.address = keys[0].address;
                let styleObj = getStyleObj(this.tangram_play.scene, this.address);

                if (styleObj===undefined) {
                    if (this.active) this.element.parentNode.removeChild(this.element);
                    this.active = false;
                    return;
                }

                this.animated = styleObj.animated;

                if (isNormalBlock(this.address)){
                    this.tangram_play.editor.addWidget({line: nLine, ch: 0}, this.element);

                    if (!this.active) {
                        this.sandbox = new GlslCanvas(this.canvas);
                    } 

                    let fragmentCode =  getFramgmentHeader(this.tangram_play.scene, this.sandbox.uniforms, this.address) + 
                                        // this._getBlockUntilLine(this.address, nLine) +
                                        getAddressSceneContent(this.tangram_play.scene, this.address) +
                                        "\ngl_FragColor = vec4(normal,1.0);\n}";

                    this.sandbox.load(fragmentCode, getVertex(this.tangram_play.scene, this.sandbox.uniforms, this.address));          

                    if (!this.active) {
                        this.active = true;
                        this.render();
                    }
                } else if (isColorBlock(this.address)){
                    this.tangram_play.editor.addWidget( {line: nLine, ch: 0} , this.element);

                    if (!this.active) {
                        this.sandbox = new GlslCanvas(this.canvas);
                    } 

                    let block_normal = "\n"
                    if (styleObj.shaders.blocks.normal) {
                        for (let i = 0; i < styleObj.shaders.blocks.normal.length; i++){
                            block_normal += styleObj.shaders.blocks.normal[i] + "\n";
                        }
                    }

                    let fragmentCode =  getFramgmentHeader(this.tangram_play.scene, this.sandbox.uniforms, this.address) + 
                                        block_normal + 
                                        // this._getBlockUntilLine(this.address, line) +
                                        getAddressSceneContent(this.tangram_play.scene, this.address) +
                                        "\ngl_FragColor = color;\n}";

                    this.sandbox.load(fragmentCode, getVertex(this.tangram_play.scene, this.sandbox.uniforms, this.address));          

                    if (!this.active) {
                        this.active = true;
                        this.render();
                    }
                } else {
                    this.disable();
                }

                if (this.active) {
                    if (styleObj.material) {
                        for (let el in styleObj.material) {
                            if (!Array.isArray(styleObj.material[el]) && styleObj.material[el].texture ){
                                this.sandbox.setUniform("u_material_"+el+"_texture", styleObj.material[el].texture);
                                this.sandbox.setUniform("u_material."+el+"Scale",styleObj.material[el].scale);
                            }
                        }
                    }
                }
            }
        } else {
            this.disable();
        }
    }

    render() {
    	if (this.active) { // && this.animated) {

            let styleObj = getStyleObj(this.tangram_play.scene, this.address);

            // Tangram uniforms
            this.sandbox.setUniform("u_meters_per_pixel",[this.tangram_play.scene.meters_per_pixel]);
            this.sandbox.setUniform("u_device_pixel_ratio",window.devicePixelRatio);
            this.sandbox.uniform("1f","float","u_map_position", [this.tangram_play.scene.center_meters.x, this.tangram_play.scene.center_meters.y, this.tangram_play.scene.zoom]);
            this.sandbox.setUniform("u_tile_origin", [this.tangram_play.scene.center_tile.x, this.tangram_play.scene.center_tile.y, this.tangram_play.scene.center_tile.z]);
            this.sandbox.setUniform("u_vanishing_point", this.tangram_play.scene.camera.vanishing_point);

            this.sandbox.setUniforms(this.uniforms);

			this.sandbox.render();
			requestAnimationFrame(function(){
				tangramPlay.editor.glsl_sandbox.render();
			}, 1000 / 30);
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
    if (keys.length===0) {
        console.log("Error: no Style on: ", address );
        return {};
    }
    return sc.styles[keys[1]];
}

function getVertex(scene, uniforms, address) {
    let block_uniforms = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    vec3 u_eye = vec3(1.0);

    attribute vec3 a_position;
    attribute vec2 a_texcoord;

    varying vec2 v_texcoord;
    varying vec3 v_world_position;

    `

    for (let u in uniforms) {
        let uniform = uniforms[u];
        block_uniforms += "uniform " + uniform.type + " " + uniform.name + ";\n";
    }

    console.log(block_uniforms);

    let styleObj = getStyleObj(scene, address);

    let block_global = "\n";
    if (styleObj.shaders.blocks.global) {
        for (let i = 0; i < styleObj.shaders.blocks.global.length; i++){
            block_global += styleObj.shaders.blocks.global[i] + "\n";
        }
    }
            
    let core = `
    void main() {
        vec4 position = vec4(a_position.xy, 0.0, 1.0);
        v_texcoord = a_texcoord;
        v_world_position = u_map_position*0.001;
        v_world_position.xy += (a_texcoord*u_meters_per_pixel);
        v_world_position.xy *= 100.;
     `;

    let block_position = "\n";
    if (styleObj.shaders.blocks.position) {
        for (let i = 0; i < styleObj.shaders.blocks.position.length; i++){
            block_position += styleObj.shaders.blocks.position[i] + "\n";
        }
    }

    let ending = `
        gl_Position = position;
    }
    `;

    return block_uniforms + block_global + core + block_position + ending;
}

function getFramgmentHeader(scene, uniforms, address) {
    let styleObj = getStyleObj(scene, address);

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

    varying vec2 v_texcoord;
    varying vec3 v_world_position;

    vec3 v_normal = vec3(0.0,0.0,1.0);

    `

    for (let u in uniforms) {
        let uniform = uniforms[u];
        block_uniforms += "uniform " + uniform.type + " " + uniform.name + ";\n";
    }

    let block_global = "\n";
    if (styleObj.shaders.blocks.global) {
        for (let i = 0; i < styleObj.shaders.blocks.global.length; i++){
            block_global += styleObj.shaders.blocks.global[i] + "\n";
        }
    }

    let pre = `
        void main() {
            #ifdef SPHERE
            v_normal = sphereNormal(v_texcoord);
            #endif

            vec3 normal = v_normal;

            #ifdef TANGRAM_MATERIAL_NORMAL_TEXTURE
                calculateNormal(normal);
            #endif

            vec2 TEMPLATE_ST = v_texcoord.xy;

            #ifdef SPHERE
            TEMPLATE_ST = sphereCoords(TEMPLATE_ST,1.0);
            #endif
          
            v_color.rgb = u_color;
            //v_color.rgb = hsb2rgb(vec3(fract(u_time*0.01),1.,1.));

            #ifdef SPHERE
            v_color = mix(v_color, vec4(0.), 
                          step(.25,dot(vec2(0.5)-v_texcoord,vec2(0.5)-v_texcoord)) );
            #endif

            vec4 color = v_color;
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