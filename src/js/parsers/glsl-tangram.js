'use strict';

import CodeMirror from 'codemirror'
import 'codemirror/mode/clike/clike.js'

function words(str) {
    let obj = {}, words = str.split(" ");
    for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
}

function cppHook(stream, state) {
    if (!state.startOfLine) return false;
    for (;;) {
        if (stream.skipTo("\\")) {
            stream.next();
            if (stream.eol()) {
                state.tokenize = cppHook;
                break;
            }
        } else {
            stream.skipToEnd();
            state.tokenize = null;
            break;
        }
    }
    return "meta";
}

function def(mimes, mode) {
    if (typeof mimes == "string") mimes = [mimes];
    let words = [];
    function add(obj) {
        if (obj) for (var prop in obj) if (obj.hasOwnProperty(prop))
        words.push(prop);
    }
    add(mode.keywords);
    add(mode.builtin);
    add(mode.atoms);
    if (words.length) {
        mode.helperType = mimes[0];
        CodeMirror.registerHelper("hintWords", mimes[0], words);
    }

    for (let i = 0; i < mimes.length; ++i)
        CodeMirror.defineMIME(mimes[i], mode);
}

def(["glsl","x-shader/x-vertex", "x-shader/x-fragment"], {
    name: "clike",
    keywords: words("float int bool void " +
                    "vec2 vec3 vec4 ivec2 ivec3 ivec4 bvec2 bvec3 bvec4 " +
                    "mat2 mat3 mat4 " +
                    "sampler2D samplerCube " +
                    "const attribute uniform varying " +
                    "break continue discard return " +
                    "for while do if else struct " +
                    "in out inout"),
    blockKeywords: words("for while do if else struct"),
    builtin: words("radians degrees sin cos tan asin acos atan " +
                    "pow exp log exp2 sqrt inversesqrt " +
                    "abs sign floor ceil fract mod min max clamp mix step smoothstep " +
                    "length distance dot cross normalize faceforward " +
                    "reflect refract matrixCompMult " +
                    "lessThan lessThanEqual greaterThan greaterThanEqual " +
                    "equal notEqual any all not " +
                    "texture2D textureCube"),
    atoms: words("true false " +
                 "u_time u_meters_per_pixel u_device_pixel_ratio u_map_position u_tile_origin " +
                 "v_world_position v_texcoord " +
                 "v_position position width v_color color v_normal normal material " +
                 "light_accumulator_ambient light_accumulator_diffuse light_accumulator_specular " +
                 "gl_FragColor gl_Position gl_PointSize gl_FragCoord "),
    hooks: {"#": cppHook},
    modeProps: {fold: ["brace", "include"]}
});
