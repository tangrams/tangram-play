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

        //  private variables
        this.tangram_play = tangram_play;

        //	used variables
        this.active = false;
        this.sandbox = undefined;
        this.line = -1;
        this.animated = false;

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

        // Suggestions are trigged by the folowing CM events
        tangram_play.editor.on("cursorActivity", function(cm) {
            cm.glsl_sandbox.update();
        });

        tangram_play.editor.on("changes", function(cm, changesObj) {
            stopAction(cm);
        });
    }

    update() {
    	let line = this.tangram_play.editor.getCursor().line;
    	if (line !== this.line){
    		this.line = line;
    		this.update_changes(line);
    	}
    }

    update_changes(nLine) {
        if (!isEmpty(this.tangram_play.editor,nLine)){
            let keys = this.tangram_play.getKeysOnLine(nLine);
            if (keys && keys[0]){
                let address = keys[0].address;
                let shaderObj = this._getShaderObj(address);

                if (shaderObj===undefined) {
                    if (this.active) this.element.parentNode.removeChild(this.element);
                    this.active = false;
                    return;
                }

                this.animated = shaderObj.animated;

                if (isNormalBlock(address)){
                    this.tangram_play.editor.addWidget( {line: nLine, ch: 0} , this.element);

                    if (!this.active) {
                        this.sandbox = new GlslCanvas(this.canvas);
                    } 

                    let fragmentCode =  this._getHeaderTemplate(address) + 
                                        // this._getBlockUntilLine(address, nLine) +
                                        getAddressSceneContent(this.tangram_play.scene, address) +
                                        this._getNormalEnding();

                    this.sandbox.load(fragmentCode, this._getVertex(address));          

                    if (!this.active) {
                        this.active = true;
                        this._frame();
                    }
                } else if (isColorBlock(address)){
                    this.tangram_play.editor.addWidget( {line: nLine, ch: 0} , this.element);

                    if (!this.active) {
                        this.sandbox = new GlslCanvas(this.canvas);
                    } 

                    let block_normal = "\n"
                    if (shaderObj.shaders.blocks.normal) {
                        for (let i = 0; i < shaderObj.shaders.blocks.normal.length; i++){
                            block_normal += shaderObj.shaders.blocks.normal[i] + "\n";
                        }
                    }

                    let fragmentCode =  this._getHeaderTemplate(address) + 
                                        block_normal + 
                                        // this._getBlockUntilLine(address, nLine) +
                                        getAddressSceneContent(this.tangram_play.scene, address) +
                                        this._getColorEnding();

                    this.sandbox.load(fragmentCode, this._getVertex(address));          

                    if (!this.active) {
                        this.active = true;
                        this._frame();
                    }
                } else {
                    this.disable();
                }

                if (this.active) {
                    if (shaderObj.material) {
                        for (let el in shaderObj.material) {
                            if (!Array.isArray(shaderObj.material[el]) && shaderObj.material[el].texture ){
                                this.sandbox.setUniform("u_material_"+el+"_texture", shaderObj.material[el].texture);
                                this.sandbox.setUniform("u_material."+el+"Scale",shaderObj.material[el].scale);
                            }
                        }
                    }
                }
            }
        } else {
            this.disable();
        }
    }

    setColor(colorArray) {
        this.sandbox.setUniform("u_color",colorArray);
    }

    disable() {
        if (this.active) {
            this.element.parentNode.removeChild(this.element);
        }
        this.active = false;
    }

    _frame() {
    	if (this.active) { // && this.animated) {
			this.sandbox.setUniform("u_meters_per_pixel",this.tangram_play.scene.meters_per_pixel);
			this.sandbox.setUniform("u_device_pixel_ratio",window.devicePixelRatio);
			this.sandbox.setUniform("u_map_position", [this.tangram_play.scene.center_meters.x, this.tangram_play.scene.center_meters.y, this.tangram_play.scene.zoom]);
			this.sandbox.setUniform("u_tile_origin", [this.tangram_play.scene.center_tile.x, this.tangram_play.scene.center_tile.y, this.tangram_play.scene.center_tile.z]);
			this.sandbox.setUniform("u_vanishing_point", this.tangram_play.scene.camera.vanishing_point);

			this.sandbox.render();
			requestAnimationFrame(function(){
				tangramPlay.editor.glsl_sandbox._frame();
			}, 1000 / 30);
    	}
    }

    _getBlockUntilLine(address, nLine) {
        let from = this.tangram_play.getKeyForAddress(address).pos.line+1;
        let to = nLine+1;

        let block = "\n";
        for (let i = from; i < to; i++) {
            block += this.tangram_play.editor.getLine(i);
        }

        let nP = getNumberOfOpenParentesis(block);
        for (let i = 0; i < nP; i++) {
            block += "}\n";
        }
        return block;
    }

    _getShaderObj(address) {
    	let keysToShader = getKeysFromAddress(address);
		return this.tangram_play.scene.styles[keysToShader[1]];
    }

    _getVertex(address) {
    	let header = `
    	#ifdef GL_ES
    	precision mediump float;
    	#endif

		uniform vec2 u_resolution;
		uniform vec2 u_mouse;
		uniform float u_time;
		uniform float u_meters_per_pixel;
		uniform float u_device_pixel_ratio;

		uniform vec3 u_map_position;
		uniform vec3 u_tile_origin;

        uniform vec3 u_color;

		vec3 u_eye = vec3(1.0);
		uniform vec2 u_vanishing_point;

		attribute vec3 a_position;
		attribute vec2 a_texcoord;

		varying vec2 v_texcoord;
		varying vec3 v_world_position;
		`

		let shaderObj = this._getShaderObj(address);

		let block_global = "\n";
		if (shaderObj.shaders.blocks.global) {
			for (let i = 0; i < shaderObj.shaders.blocks.global.length; i++){
				block_global += shaderObj.shaders.blocks.global[i] + "\n";
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
		if (shaderObj.shaders.blocks.position) {
			for (let i = 0; i < shaderObj.shaders.blocks.position.length; i++){
				block_position += shaderObj.shaders.blocks.position[i] + "\n";
			}
		}

		let ending = `
			gl_Position = position;
		}
    	`;

    	return header + block_global + core + block_position + ending;
    }

    _getHeaderTemplate(address) {
    	let shaderObj = this._getShaderObj(address);

    	let defines = "\n";
    	for(let name in shaderObj.defines){
    		if (shaderObj.defines[name]) {
    			defines += "#define " + name + (shaderObj.defines[name] === true ? "\n" : " " + shaderObj.defines[name] + "\n");
    		}
    	}

    	// if (shaderObj.base && shaderObj.base === "polygons"){
    	// 	defines += "#define SPHERE\n";
    	// }

    	let block_material = "\n";
		if (shaderObj.shaders.blocks.material) {
			for (let i = 0; i < shaderObj.shaders.blocks.material.length; i++){
				block_material += shaderObj.shaders.blocks.material[i] + "\n";
			}
		}

		let header = `
			#ifdef GL_ES
			precision mediump float;
			#endif

			uniform vec2 u_resolution;
			uniform vec2 u_mouse;
			uniform float u_time;
			uniform float u_meters_per_pixel;
			uniform float u_device_pixel_ratio;

			uniform vec3 u_map_position;
			uniform vec3 u_tile_origin;

            uniform vec3 u_color;

			varying vec2 v_texcoord;
			varying vec3 v_world_position;

			vec3 u_eye = vec3(1.0);
			uniform vec2 u_vanishing_point;

			vec3 v_normal = vec3(0.0,0.0,1.0);
			vec4 v_color = vec4(1.0,0.0,1.0,1.0);

			vec3 hsb2rgb( in vec3 c ){
			    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
			                             6.0)-3.0)-1.0, 
			                     0.0, 
			                     1.0 );
			    rgb = rgb*rgb*(3.0-2.0*rgb);
			    return c.z * mix( vec3(1.0), rgb, c.y);
			}

			#ifdef SPHERE
			vec3 sphereNormal(vec2 uv) {
			    uv = fract(uv)*2.0-1.0; 
			    vec3 ret;
			    ret.xy = sqrt(uv * uv) * sign(uv);
			    ret.z = sqrt(abs(1.0 - dot(ret.xy,ret.xy)));
			    return ret * 0.5 + 0.5;
			}

			vec2 sphereCoords(vec2 _st, float _scale){
			    float maxFactor = sin(1.570796327);
			    vec2 uv = vec2(0.0);
			    vec2 xy = 2.0 * _st.xy - 1.0;
			    float d = length(xy);
			    if (d < (2.0-maxFactor)){
			        d = length(xy * maxFactor);
			        float z = sqrt(1.0 - d * d);
			        float r = atan(d, z) / 3.1415926535 * _scale;
			        float phi = atan(xy.y, xy.x);

			        uv.x = r * cos(phi) + 0.5;
			        uv.y = r * sin(phi) + 0.5;
			    } else {
			        uv = _st.xy;
			    }
			    return uv;
			}
			#endif
		`;

		let block_global = "\n";
		if (shaderObj.shaders.blocks.global) {
			for (let i = 0; i < shaderObj.shaders.blocks.global.length; i++){
				block_global += shaderObj.shaders.blocks.global[i] + "\n";
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

		return defines + header + block_material + block_global + pre;
    }

    _getNormalEnding() {
    	return `
			gl_FragColor = vec4(normal,1.0);
		}
		`;
	}

    _getColorEnding() {
	    return `
			gl_FragColor = color;
		}
		`;
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