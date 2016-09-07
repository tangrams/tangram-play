import tinycolor from 'tinycolor2';

const valueRanges = {
    rgb: { r: [0, 255], g: [0, 255], b: [0, 255] },
};

export default class Color {
    constructor(color) {
        // Invalid colors (junk input or user is typing) are created as white by default
        // We need a way to distinguish what inputs were junk, so invalid colors
        // will be this.valid = false
        this.valid = true;

        const firstPass = this.processColor(color); // Catch a color written in vec format
        const secondPass = this.processTinyColor(firstPass); // Creates a tinycolor color object

        this.color = secondPass;
    }

    /**
     * Process a color that could be taken from a valid YAML scene file.
     * As such, we need to check for array notation and for hex written as a string
     *
     * @private
     * @param {string} color - color to parse
     */
    processColor(color) {
        if (typeof color === 'string' || color instanceof String) {
            // If a hex color
            if (color.charAt(0) === '\'' && (color.charAt(color.length - 1) === '\'')) {
                return color.replace(/'/g, '');
            } else if ((color.charAt(0) === '[') && (color.charAt(color.length - 1) === ']')) {
                // If a vec color
                let colorString = color;
                colorString = colorString.replace('[', '');
                colorString = colorString.replace(']', '');
                colorString = colorString.split(',');

                if (colorString.length >= 3) {
                    const vec = { v: colorString[0], e: colorString[1], c: colorString[2] };
                    const rgb = this.vec2rgb(vec);

                    // We need to add an alpha by default so that the widget
                    // button can update css properly
                    rgb.a = 1.0;

                    if (colorString.length === 4) {
                        rgb.a = parseFloat(colorString[3]);
                    }
                    return rgb;
                }

                this.valid = false;
                return 'white';
            }
        }

        // If a normal css color
        return color;
    }

    /**
     * Creates a tinycolor color object
     *
     * @private
     * @param {string} color - color to parse
     */
    processTinyColor(color) {
        // Tangram.js's color parsing library (css-color-parser-js) allows
        // spaces in color strings, with the following rationale:
        //     "Remove all whitespace, not compliant, but should just be
        //      more accepting."
        // (https://github.com/deanm/css-color-parser-js/blob/master/csscolorparser.js#L132)
        //
        // This means someone can author a working scene file with colors
        // like "light goldenrod yellow", and Tangram Play's color picker
        // must also support this now. See discussion:
        // https://github.com/tangrams/tangram-play/issues/519
        if (typeof color === 'string') {
            color = color.replace(/ /g, '');
        }

        let newColor = tinycolor(color);

        if (!newColor.isValid()) {
            this.valid = false;
            newColor = tinycolor('white');
        }

        return newColor;
    }

    /**
     * Converts the internally stored color from vec to rgb
     *
     * @private
     */
    vec2rgb(vec) {
        return {
            r: vec.v * valueRanges.rgb.r[1],
            g: vec.e * valueRanges.rgb.g[1],
            b: vec.c * valueRanges.rgb.b[1],
        };
    }

    /**
     * Converts the internally stored color from rgb to vec
     *
     * @private
     */
    rgb2vec() {
        return {
            v: this.color.toRgb().r / valueRanges.rgb.r[1],
            e: this.color.toRgb().g / valueRanges.rgb.g[1],
            c: this.color.toRgb().b / valueRanges.rgb.b[1],
        };
    }

    // Returns rgba object { r: , g: , b: , a: }
    getRgba() {
        return this.color.toRgb();
    }

    // Returns rgba string "rgba(255, 0, 0, 0.5)"
    getRgbaString() {
        return this.color.toRgbString();
    }

    // Returns vec string "[0.x, 0.x , 0.x, 0.x]"
    getVecString() {
        const vecColor = this.rgb2vec();
        const v = vecColor.v.toFixed(3);
        const e = vecColor.e.toFixed(3);
        const c = vecColor.c.toFixed(3);
        const a = this.color.getAlpha().toFixed(2);
        return `[${v}, ${e}, ${c}, ${a}]`;
    }

    // For use within widget-links and shader blocks
    // Returns vec string "[0.x, 0.x , 0.x]" No alpha.
    getVec3String() {
        const vecColor = this.rgb2vec();
        const v = vecColor.v.toFixed(3);
        const e = vecColor.e.toFixed(3);
        const c = vecColor.c.toFixed(3);
        return `vec3(${v}, ${e}, ${c})`;
    }

    // For use within widget-links and shader blocks
    // Returns vec string "[0.x, 0.x , 0.x]" No alpha.
    getVec4String() {
        const vecColor = this.rgb2vec();
        const v = vecColor.v.toFixed(3);
        const e = vecColor.e.toFixed(3);
        const c = vecColor.c.toFixed(3);
        const a = this.color.getAlpha().toFixed(2);
        return `vec4(${v}, ${e}, ${c}, ${a})`;
    }

    // Returns hex string without '#'
    getHexString() {
        return this.color.toHexString().replace('#', '');
    }

    // { h: 0, s: 1, l: 0.5, a: 1 }
    getHsl() {
        return this.color.toHsl();
    }

    // { h: 0, s: 1, v: 1, a: 1 }
    getHsv() {
        return this.color.toHsv();
    }

    // Returns original input string
    getOriginalInput() {
        return this.color.getOriginalInput();
    }

    // Sets an alpha for the color
    setAlpha(alpha) {
        this.color.setAlpha(alpha);
    }
}
