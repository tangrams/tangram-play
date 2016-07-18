import tinycolor from 'tinycolor2';

const valueRanges = {
    rgb: { r: [0, 255], g: [0, 255], b: [0, 255] }
};

export default class Color {
    constructor (color) {
        let firstPass = this._processColor(color); // Catch a color written in vec format
        let secondPass = this._processRGB(firstPass); // Convert color to rgb

        this.color = secondPass;
    }

    /**
     * Process a color that could be taken from a valid YAML scene file.
     * As such, we need to check for array notation and for hex written as a string
     *
     * @param color - color to parse
     */
    _processColor (color) {
        if (typeof color === 'string' || color instanceof String) {
            // If a hex color
            if (color.charAt(0) === '\'' && (color.charAt(color.length - 1) === '\'')) {
                return color.replace(/'/g, '');
            }
            // If a vec color
            else if ((color.charAt(0) === '[') && (color.charAt(color.length - 1) === ']')) {
                let colorString = color;
                colorString = colorString.replace('[', '');
                colorString = colorString.replace(']', '');
                colorString = colorString.split(',');

                if (colorString.length >= 3) {
                    let vec = { v: colorString[0], e: colorString[1], c: colorString[2] };
                    let rgb = this._vec2rgb(vec);
                    rgb.a = 1.0; // We need to add an alpha by default so that the widget button can update css properly

                    if (colorString.length === 4) {
                        rgb.a = parseFloat(colorString[3]);
                    }
                    return rgb;
                }

                return 'white';
            }
        }
        // If a normal css color
        return color;
    }

    _processRGB (color) {
        let newColor = tinycolor(color);

        if (!newColor.isValid()) {
            newColor = tinycolor('white');
        }

        return newColor;
    }

    _vec2rgb (vec) {
        return {
            r: vec.v * valueRanges.rgb.r[1],
            g: vec.e * valueRanges.rgb.g[1],
            b: vec.c * valueRanges.rgb.b[1]
        };
    }

    _rgb2vec () {
        return {
            v: this.color.toRgb().r / valueRanges.rgb.r[1],
            e: this.color.toRgb().g / valueRanges.rgb.g[1],
            c: this.color.toRgb().b / valueRanges.rgb.b[1]
        };
    }

    // Returns rgba object { r: , g: , b: , a: }
    getRgba () {
        return this.color.toRgb();
    }

    // Returns rgba string "rgba(255, 0, 0, 0.5)"
    getRgbaString () {
        return this.color.toRgbString();
    }

    getVecString () {
        let vecColor = this._rgb2vec();
        let vecColorString = '[' + vecColor.v.toFixed(3) + ', ' + vecColor.e.toFixed(3) + ', ' + vecColor.c.toFixed(3) + ', ' + (this.color.getAlpha()).toFixed(2) + ']';
        return vecColorString;
    }

    // Returns original input string
    getOriginalInput () {
        return this.color.getOriginalInput();
    }
}
