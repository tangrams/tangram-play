'use strict';

// Some common use variables
var startPoint;
var currentTarget;
var currentTargetWidth = 0;
var currentTargetHeight = 0;

// placeholders for later
var modal;
var hsv_map;
var hsv_mapCover;
var hsv_mapCursor;
var hsv_barBGLayer;
var hsv_barWhiteLayer;
var hsv_barCursors;
var hsv_barCursorsCln;
var hsv_Leftcursor;
var hsv_Rightcursor;
var colorDisc;
var colorDiscRadius;
var luminanceBar;

var myColor;

var documentFragmentCache;

var listeners = {};

const Tools = {
    getOrigin (el) {
        const box = (el.getBoundingClientRect) ? el.getBoundingClientRect() : { top: 0, left: 0 };
        const doc = el && el.ownerDocument;
        const body = doc.body;
        const win = doc.defaultView || doc.parentWindow || window;
        const docElem = doc.documentElement || body.parentNode;
        const clientTop = docElem.clientTop || body.clientTop || 0; // border on html or body or both
        const clientLeft = docElem.clientLeft || body.clientLeft || 0;

        return {
            left: box.left + (win.pageXOffset || docElem.scrollLeft) - clientLeft,
            top:  box.top  + (win.pageYOffset || docElem.scrollTop)  - clientTop
        };
    },
    eventCache: null,
    addEvent (obj, type, func) {
        this.eventCache = this.eventCache || {
            _get: (obj, type, func, checkOnly) => {
                let cache = this.eventCache[type] || [];

                for (var n = cache.length; n--; ) {
                    if (obj === cache[n].obj && '' + func === '' + cache[n].func) {
                        func = cache[n].func;
                        if (!checkOnly) {
                            cache[n] = cache[n].obj = cache[n].func = null;
                            cache.splice(n, 1);
                        }
                        return func;
                    }
                }
            },
            _set: (obj, type, func) => {
                let cache = this.eventCache[type] = this.eventCache[type] || [];

                if (this.eventCache._get(obj, type, func, true)) {
                    return true;
                } else {
                    cache.push({
                        func: func,
                        obj: obj
                    });
                }
            }
        };

        if (!func.name && this.eventCache._set(obj, type, func) || typeof func !== 'function') {
            return;
        }

        if (obj.addEventListener) obj.addEventListener(type, func, false);
        else obj.attachEvent('on' + type, func);
    },
    removeEvent (obj, type, func) {
        if (typeof func !== 'function') return;
        if (!func.name) {
            func = this.eventCache._get(obj, type, func) || func;
        }

        if (obj.removeEventListener) obj.removeEventListener(type, func, false);
        else obj.detachEvent('on' + type, func);
    }
};

export default class ColorPickerModal {
    constructor (color = '#000') {
        this.color = color;
        this.init();
    }

    init () {
        this.dom = this.createDom();
        this.el = this.dom.firstElementChild;
        // Temporarily refer to this outside of the object prototype for helper functions
        modal = this.el;

        myColor = new Colors({
            color: this.color
        });

        this.lib = myColor;

        hsv_map = modal.querySelector('.colorpicker-hsv-map');
        hsv_mapCover = hsv_map.children[1]; // well...
        hsv_mapCursor = hsv_map.children[2];
        hsv_barBGLayer = hsv_map.children[3];
        hsv_barWhiteLayer = hsv_map.children[4];
        hsv_barCursors = hsv_map.children[6];
        hsv_barCursorsCln = hsv_barCursors.className;
        hsv_Leftcursor = hsv_barCursors.children[0];
        hsv_Rightcursor = hsv_barCursors.children[1];

        colorDisc = modal.querySelector('.colorpicker-disc');
        luminanceBar = modal.querySelector('.colorpicker-bar-luminance');
    }

    createDom () {
        /* Creates this DOM structure :-/

        <div id='cp' class='colorpicker-modal'>
          <div class='colorpicker-patch'></div>
          <div class='colorpicker-hsv-map' id='cp-map'>
            <canvas class='colorpicker-disc' width='200' height='200'></canvas>
            <div class='colorpicker-disc-cover'></div>
            <div class='colorpicker-disc-cursor'></div>
            <div class='colorpicker-bar-bg'></div>
            <div class='colorpicker-bar-white'></div>
            <canvas class='colorpicker-bar-luminance' width='25' height='200'></canvas>
            <div class='colorpicker-bar-cursors' id='cp-bar'>
              <div class='colorpicker-bar-cursor-left'></div>
              <div class='colorpicker-bar-cursor-right'></div>
            </div>
          </div>
        </div>

        */

        // Creates DOM structure for the widget.
        // This also caches the DOM nodes in memory so that it does
        // not need to be re-created on subsequent inits.
        if (!documentFragmentCache) {
            documentFragmentCache = document.createDocumentFragment();
            var modal = document.createElement('div');
            var patch = document.createElement('div');
            var map = document.createElement('div');
            var disc = document.createElement('canvas');
            var cover = document.createElement('div');
            var cursor = document.createElement('div');
            var barbg = document.createElement('div');
            var barwhite = document.createElement('div');
            var barlum = document.createElement('canvas');
            var barcursors = document.createElement('div');
            var leftcursor = document.createElement('div');
            var rightcursor = document.createElement('div');

            var CSS_PREFIX = 'colorpicker' + '-';

            modal.className = CSS_PREFIX + 'modal';
            patch.className = CSS_PREFIX + 'patch';
            map.className = CSS_PREFIX + 'hsv-map';
            disc.className = CSS_PREFIX + 'disc';
            cover.className = CSS_PREFIX + 'disc-cover';
            cursor.className = CSS_PREFIX + 'disc-cursor';
            barbg.className = CSS_PREFIX + 'bar-bg';
            barwhite.className = CSS_PREFIX + 'bar-white';
            barlum.className = CSS_PREFIX + 'bar-luminance';
            barcursors.className = CSS_PREFIX + 'bar-cursors';
            leftcursor.className = CSS_PREFIX + 'bar-cursor-left';
            rightcursor.className = CSS_PREFIX + 'bar-cursor-right';

            disc.width = 200;
            disc.height = 200;
            barlum.width = 25;
            barlum.height = 200;
            map.id = 'cp-map';
            barcursors.id = 'cp-bar';

            modal.appendChild(patch);
            modal.appendChild(map);
            map.appendChild(disc);
            map.appendChild(cover);
            map.appendChild(cursor);
            map.appendChild(barbg);
            map.appendChild(barwhite);
            map.appendChild(barlum);
            map.appendChild(barcursors);
            barcursors.appendChild(leftcursor);
            barcursors.appendChild(rightcursor);
            documentFragmentCache.appendChild(modal);
        }

        // Returns a clone of the cached document fragment
        return documentFragmentCache.cloneNode(true);
    }

    presentModal (x, y) {
        this.dom.firstElementChild.style.left = x + 'px';
        this.dom.firstElementChild.style.top = y + 'px';
        document.body.appendChild(this.dom);

        colorDiscRadius = colorDisc.offsetHeight / 2;

        Tools.addEvent(hsv_map, 'mousedown', hsvDown); // event delegation
        Tools.addEvent(window, 'mouseup', function () {
            Tools.removeEvent (window, 'mousemove', hsvMove);
            hsv_map.classList.remove('colorpicker-no-cursor');
            stopRender();
        });

        window.setTimeout(function () {
            window.addEventListener('click', _onClickOutsideElement, false);
        }, 0);

        if (colorDisc.getContext) {
            drawDisk( // HSV color wheel with white center
                colorDisc.getContext("2d"),
                [colorDisc.width / 2, colorDisc.height / 2],
                [colorDisc.width / 2 - 1, colorDisc.height / 2 - 1],
                360,
                function(ctx, angle) {
                    var gradient = ctx.createRadialGradient(1, 1, 1, 1, 1, 0);
                    gradient.addColorStop(0, 'hsl(' + (360 - angle + 0) + ', 100%, 50%)');
                    gradient.addColorStop(1, "#FFFFFF");

                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
            );
            drawCircle( // gray border
                colorDisc.getContext("2d"),
                [colorDisc.width / 2, colorDisc.height / 2],
                [colorDisc.width / 2, colorDisc.height / 2],
                '#303030',
                2
            );
            // draw the luminanceBar bar
            var ctx = luminanceBar.getContext('2d');
            var gradient = ctx.createLinearGradient(0, 0, 0, 200);

            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, 'black');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 30, 200);
        }

        doRender(this.lib.colors);
    }

    // Monkey patches for Thistle.js functionality

    on (type, callback) {
        listeners[type] = callback;
    }

    getCSS () {
        return '#' + this.lib.colors.HEX.toLowerCase();
    }

    getRGB () {
        const RND = this.lib.colors.RND;
        return {
            r: RND.rgb.r / 255,
            g: RND.rgb.g / 255,
            b: RND.rgb.b / 255
        }
    }
}


/**
 *  Gets CSS color strings for output
 */
function getColorValues (color) {
    var RND = color.RND;

    return {
        hex: '#' + color.HEX,
        rgb: 'rgb(' + RND.rgb.r  + ',' + RND.rgb.g  + ',' + RND.rgb.b  + ')',
        rgba: 'rgba(' + RND.rgb.r  + ',' + RND.rgb.g  + ',' + RND.rgb.b  + ',' + color.alpha + ')',
        hsl: 'hsl(' + RND.hsl.h  + ',' + RND.hsl.s  + ',' + RND.hsl.l  + ')',
        hsla: 'hsla(' + RND.hsl.h  + ',' + RND.hsl.s  + ',' + RND.hsl.l  + ',' + color.alpha + ')',
    }
}

/**
 *  Returns true if the color is bright
 *  Helps determine which contrasting text color you need
 */
function isThisColorBright (color) {
    return (color.rgbaMixBlack.luminance > 0.22) ? true : false;
}

/**
 *  Render color patch
 */
function renderTestPatch (color) {
    var patch = modal.querySelector('.colorpicker-patch');
    var RGB = color.RND.rgb;
    patch.style.backgroundColor = 'rgb(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ')';
};

/* ---------------------------------- */
/* ---- HSV-circle color picker ----- */
/* ---------------------------------- */

var hsvDown = function (e) { // mouseDown callback
    var target = e.target || e.srcElement;

    if (e.preventDefault) e.preventDefault();

    currentTarget = target.id ? target : target.parentNode;
    startPoint = Tools.getOrigin(currentTarget);
    currentTargetHeight = currentTarget.offsetHeight; // as diameter of circle

    Tools.addEvent(window, 'mousemove', hsvMove);
    hsv_map.classList.add('colorpicker-no-cursor');
    hsvMove(e);
    startRender();
};

var hsvMove = function (e) { // mouseMove callback
    var r, x, y, h, s;

    if(currentTarget === hsv_map) { // the circle
        r = currentTargetHeight / 2,
        x = e.clientX - startPoint.left - r,
        y = e.clientY - startPoint.top - r,
        h = 360 - ((Math.atan2(y, x) * 180 / Math.PI) + (y < 0 ? 360 : 0)),
        s = (Math.sqrt((x * x) + (y * y)) / r) * 100;
        myColor.setColor({h: h, s: s}, 'hsv');
    } else if (currentTarget === hsv_barCursors) { // the luminanceBar
        myColor.setColor({
            v: (currentTargetHeight - (e.clientY - startPoint.top)) / currentTargetHeight * 100
        }, 'hsv');
    }

    // fire 'changed'
    if (listeners.changed && typeof listeners.changed === 'function') {
        listeners.changed();
    }
};

var renderHSVPicker = function (color) {
    var pi2 = Math.PI * 2;
    var x = Math.cos(pi2 - color.hsv.h * pi2);
    var y = Math.sin(pi2 - color.hsv.h * pi2);
    var r = color.hsv.s * (colorDiscRadius - 5);

    hsv_mapCover.style.opacity = 1 - color.hsv.v;
    // this is the faster version...
    hsv_barWhiteLayer.style.opacity = 1 - color.hsv.s;
    hsv_barBGLayer.style.backgroundColor = 'rgb(' +
        color.hueRGB.r + ',' +
        color.hueRGB.g + ',' +
        color.hueRGB.b + ')';

    hsv_mapCursor.style.cssText =
        'left: ' + (x * r + colorDiscRadius) + 'px;' +
        'top: ' + (y * r + colorDiscRadius) + 'px;' +
        'border-color: ' + (color.RGBLuminance > 0.22 ? '#333;' : '#ddd');

    hsv_barCursors.className = color.RGBLuminance > 0.22 ? hsv_barCursorsCln + ' colorpicker-dark' : hsv_barCursorsCln;
    if (hsv_Leftcursor) hsv_Leftcursor.style.top = hsv_Rightcursor.style.top = ((1 - color.hsv.v) * colorDiscRadius * 2) + 'px';
};

// generic function for drawing a canvas disc
var drawDisk = function (ctx, coords, radius, steps, colorCallback) {
    var x = coords[0] || coords; // coordinate on x-axis
    var y = coords[1] || coords; // coordinate on y-axis
    var a = radius[0] || radius; // radius on x-axis
    var b = radius[1] || radius; // radius on y-axis
    var angle = 360;
    var rotate = 0;
    var coef = Math.PI / 180;

    ctx.save();
    ctx.translate(x - a, y - b);
    ctx.scale(a, b);

    steps = (angle / steps) || 360;

    for (; angle > 0 ; angle -= steps){
        ctx.beginPath();
        if (steps !== 360) ctx.moveTo(1, 1); // stroke
        ctx.arc(1, 1, 1,
            (angle - (steps / 2) - 1) * coef,
            (angle + (steps  / 2) + 1) * coef);

        if (colorCallback) {
            colorCallback(ctx, angle);
        } else {
            ctx.fillStyle = 'black';
            ctx.fill();
        }
    }
    ctx.restore();
};
var drawCircle = function(ctx, coords, radius, color, width) { // uses drawDisk
    width = width || 1;
    radius = [
        (radius[0] || radius) - width / 2,
        (radius[1] || radius) - width / 2
    ];
    drawDisk(ctx, coords, radius, 1, function(ctx, angle){
        ctx.restore();
        ctx.lineWidth = width;
        ctx.strokeStyle = color || '#000';
        ctx.stroke();
    });
};

/*
 * This script is set up so it runs either with ColorPicker or with Color only.
 * The difference here is that ColorPicker has a renderCallback that Color doesn't have
 * therefor we have to set a render intervall in case it's missing...
 * setInterval() can be exchanged to window.requestAnimationFrame(callBack)...
 *
 * If you want to render on mouseMove only then get rid of startRender(); in
 * all the mouseDown callbacks and add doRender(myColor.colors); in all
 * mouseMove callbacks. (Also remove all stopRender(); in mouseUp callbacks)
*/
var doRender = function (color) {
    renderHSVPicker(color);
    renderTestPatch(color);
    getColorValues(color);
};

var renderTimer;
var startRender = function (oneTime) {
    if (oneTime) {
        doRender(myColor.colors);
    } else {
        renderTimer = window.requestAnimationFrame(repeatRender);
    }
};
var repeatRender = function () {
    doRender(myColor.colors);
    renderTimer = window.requestAnimationFrame(repeatRender);
};
var stopRender = function () {
    window.cancelAnimationFrame(renderTimer);
};

function _onClickOutsideElement (event) {
    var target = event.target;

    while (target !== document.documentElement && !target.classList.contains('colorpicker-modal')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('colorpicker-modal')) {
        _loseModalFocus();
        window.removeEventListener('click', _onClickOutsideElement, false);
    }
}

function _loseModalFocus () {
    _removeModal();
}

function _removeModal () {
    var modal = document.querySelector('.colorpicker-modal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }

    window.removeEventListener('click', _onClickOutsideElement, false);
}
