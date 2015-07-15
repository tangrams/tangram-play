import { fetchHTTP } from '../core/common.js';
import { isNormalBlock, isColorBlock, getAddressSceneContent, getKeysFromAddress, getAddressFromKeys } from '../core/codemirror/yaml-tangram.js';

export default class GlslSandbox {
    constructor (tangram_play, configFile ) {

    	//  Make link to this manager inside codemirror obj to be excecuted from CM events
        tangram_play.editor.glsl_sandbox = this;

        //  private variables
        this.tangram_play = tangram_play;

        // Suggestions are trigged by the folowing CM events
        this.tangram_play.editor.on("cursorActivity", function(cm) {
            cm.glsl_sandbox.update();
        });

        this.data = JSON.parse(fetchHTTP(configFile))['sandbox'];

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'tp-a-sandbox';
        this.canvas.className = 'glsl_sandbox';
        this.canvas.setAttribute("width","130");
        this.canvas.setAttribute("height","130");
        this.canvas.setAttribute("data-fragment",this.data.defaultCode);

        this.active = false;
        this.sandbox = undefined;
        this.line = -1;
    }

    update() {
    	let line = this.tangram_play.editor.getCursor().line;
    	if (line !== this.line){
    		this.line = line;

    		let keys = this.tangram_play.getKeysOnLine(line);
	    	if (keys && keys[0]){
	    		let address = keys[0].address;
	    		if (isNormalBlock(address)){
	    			console.log("Normal Block");
	    		} else if (isColorBlock(address)){
	    			this.tangram_play.editor.addWidget( {line: line, ch: 0} , this.canvas);

	    			if (!this.active) {
	    				this.sandbox = new GlslCanvas(this.canvas);
	    			} 

	    			let template = this._getColorTemplate();

	    			let keysToShader = getKeysFromAddress(address);
	    			keysToShader.pop();
	    			keysToShader.pop();
	    			keysToShader.pop();
	    			let addressToShader = getAddressFromKeys(keysToShader);
	    			let shaderObj = getAddressSceneContent(this.tangram_play.scene, addressToShader);
	    			console.log(shaderObj);

	    // 			let defines = getAddressSceneContent(this.tangram_play.scene, getAddressFromKeys);

	    // 			let code = 	template.pre + 
	    // 						getAddressSceneContent(this.tangram_play.scene,address) +
	    // 						template.post ;

					// this.sandbox.load(code);    			

	    			this.sandbox.render();

	    			this.active = true;
	    		} else {
	    			if(this.active){
	    				this.canvas.parentNode.removeChild(this.canvas);
	    			}
	    			this.active = false;
	    		}
	    	}
    	}
    }

    _getColorTemplate() {
    	let pre = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float u_meters_per_pixel = 1.0;
float u_device_pixel_ratio = 1.0;
vec3 u_map_position = vec3(1.0);

`;

    	let post = "";

    	return {pre: pre, post: post};
    }


}