import { fetchHTTP } from '../core/common.js';
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

        this.data = JSON.parse(fetchHTTP(configFile))['sandbox'];

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'tp-a-sandbox';
        this.canvas.className = 'glsl_sandbox';
        this.canvas.setAttribute("width","130");
        this.canvas.setAttribute("height","130");
        this.canvas.setAttribute("data-fragment",this.data.defaultCode);

        // Suggestions are trigged by the folowing CM events
        tangram_play.editor.on("cursorActivity", function(cm) {
            cm.glsl_sandbox.update();
        });

        tangram_play.editor.on("changes", function(cm, changesObj) {
            if (cm.glsl_sandbox.active) {
            	let line = cm.getCursor().line;
            	cm.glsl_sandbox.update_changes(line);
            }
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
    	let keys = this.tangram_play.getKeysOnLine(nLine);
    	if (keys && keys[0]){
    		let address = keys[0].address;
    		let shaderObj = this._getShaderObj(address);

    		if (shaderObj===undefined) {
    			if (this.active) this.canvas.parentNode.removeChild(this.canvas);
    			this.active = false;
    			return;
    		}

    		this.animated = shaderObj.animated;

    		if (isNormalBlock(address)){
    			this.tangram_play.editor.addWidget( {line: nLine, ch: 0} , this.canvas);

    			if (!this.active) {
    				this.sandbox = new GlslCanvas(this.canvas);
    				this.active = true;
    			} 

    			let fragmentCode = 	this._getHeaderTemplate(address) + 
    								getAddressSceneContent(this.tangram_play.scene, address) +
    								this._getNormalEnding();

				this.sandbox.load(fragmentCode, this._getVertex(address)); 			
    			// this.sandbox.render();

    			this._frame();
    		} else if (isColorBlock(address)){
    			this.tangram_play.editor.addWidget( {line: nLine, ch: 0} , this.canvas);

    			if (!this.active) {
    				this.sandbox = new GlslCanvas(this.canvas);
    				this.active = true;
    			} 

    			let block_normal = "\n"
    			if (shaderObj.shaders.blocks.normal) {
					for (let i = 0; i < shaderObj.shaders.blocks.normal.length; i++){
						block_normal += shaderObj.shaders.blocks.normal[i] + "\n";
					}
    			}

    			let fragmentCode = 	this._getHeaderTemplate(address) + 
    								block_normal + 
    								getAddressSceneContent(this.tangram_play.scene, address) +
    								this._getColorEnding();

				this.sandbox.load(fragmentCode, this._getVertex(address)); 			
    			// this.sandbox.render();

    			this._frame();
    		} else {
    			if (this.active) {
    				this.canvas.parentNode.removeChild(this.canvas);
    			}
    			this.active = false;
    		}
    	}
    }

    _frame() {
    	if (this.active && this.animated){
			this.sandbox.render();
			requestAnimationFrame(function(){
				tangramPlay.editor.glsl_sandbox._frame();
			}, 1000 / 30);
    	}
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
		uniform float u_time;

		attribute vec3 a_position;
		attribute vec2 a_texcoord;

		varying vec2 v_texcoord;
		varying vec3 v_world_position;

		float u_meters_per_pixel = 1.0;
		float u_device_pixel_ratio = 1.0;
		vec3 u_map_position = vec3(1.0);
		vec3 u_tile_origin = vec3(1.0);
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
		 	v_world_position.xy = a_texcoord*10.0;
		 	v_world_position.z = 0.0;
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

    	// if (shaderObj.base && shaderObj.base === "polygons"){
    	// 	defines += "#define SPHERE\n";
    	// }

		let header = `
			#ifdef GL_ES
			precision mediump float;
			#endif

			uniform vec2 u_resolution;
			uniform vec2 u_mouse;
			uniform float u_time;

			varying vec2 v_texcoord;
			varying vec3 v_world_position;

			float u_meters_per_pixel = 1.0;
			float u_device_pixel_ratio = 1.0;
			vec3 u_map_position = vec3(1.0);
			vec3 u_tile_origin = vec3(1.0);

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

				vec2 TEMPLATE_ST = v_texcoord.xy;

				#ifdef SPHERE
				TEMPLATE_ST = sphereCoords(TEMPLATE_ST,1.0);
				#endif
			  
			    TEMPLATE_ST -= 0.5;
			    #ifdef SPHERE
			    TEMPLATE_ST *= 1.4;
			    #endif
			    TEMPLATE_ST = mat2(cos(-0.78539816339),-sin(-0.78539816339),
			                sin(-0.78539816339),cos(-0.78539816339)) * TEMPLATE_ST;
			    TEMPLATE_ST += 0.5;
			    v_color.rgb = hsb2rgb(vec3(floor(TEMPLATE_ST.x*10.)*0.1,1.,1.));

			    #ifdef SPHERE
				v_color = mix(v_color, vec4(0.), 
							  step(.25,dot(vec2(0.5)-v_texcoord,vec2(0.5)-v_texcoord)) );
				#endif

				vec4 color = v_color;
			`;

		return defines + header + block_global + pre;
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