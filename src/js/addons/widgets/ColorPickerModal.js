'use strict';

// Import Greensock (GSAP)
import 'gsap/src/uncompressed/Tweenlite.js';
import 'gsap/src/uncompressed/plugins/CSSPlugin.js';
import Draggable from 'gsap/src/uncompressed/utils/Draggable.js';

// Some common use variables
var startPoint;
var currentTarget;
var currentTargetWidth = 0;
var currentTargetHeight = 0;

// placeholders for later
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
        this.initRenderer();
    }

    init () {
        this.dom = this.createDom();
        this.el = this.dom.firstElementChild;

        this.lib = new Colors({
            color: this.color
        });

        hsv_map = this.el.querySelector('.colorpicker-hsv-map');
        hsv_mapCover = hsv_map.children[1]; // well...
        hsv_mapCursor = hsv_map.children[2];
        hsv_barBGLayer = hsv_map.children[3];
        hsv_barWhiteLayer = hsv_map.children[4];
        hsv_barCursors = hsv_map.children[6];
        hsv_barCursorsCln = hsv_barCursors.className;
        hsv_Leftcursor = hsv_barCursors.children[0];
        hsv_Rightcursor = hsv_barCursors.children[1];

        colorDisc = this.el.querySelector('.colorpicker-disc');
        luminanceBar = this.el.querySelector('.colorpicker-bar-luminance');
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
            let modal = document.createElement('div');
            let patch = document.createElement('div');
            let map = document.createElement('div');
            let disc = document.createElement('canvas');
            let cover = document.createElement('div');
            let cursor = document.createElement('div');
            let barbg = document.createElement('div');
            let barwhite = document.createElement('div');
            let barlum = document.createElement('canvas');
            let barcursors = document.createElement('div');
            let leftcursor = document.createElement('div');
            let rightcursor = document.createElement('div');

            const CSS_PREFIX = 'colorpicker' + '-';

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

        Tools.addEvent(hsv_map, 'mousedown', this.hsvDown.bind(this)); // event delegation
        Tools.addEvent(window, 'mouseup', () => {
            Tools.removeEvent (window, 'mousemove', this.hsvMove.bind(this));
            hsv_map.classList.remove('colorpicker-no-cursor');
            this.renderer.stop();
        });

        window.setTimeout(function () {
            window.addEventListener('click', _onClickOutsideElement, false);
        }, 0);

        // (experimental)
        // Allows color picker modal to be draggable & reposition-able on screen.
        // TODO: Better / cacheable DOM queries
        // TODO: Should dragging indicator be more obvious?
        // TODO: Fix a bug where dragging to edge of screen can close the colorpicker
        // TODO: Consider whether clicking outside a modal can close the colorpicker
        //       once it's been dragged elsewhere, and then how it can be closed then.
        this.draggable = Draggable.create(this.el, {
            type: 'x, y',
            bounds: document.querySelector('.tp-core-container'),
            trigger: this.el.querySelector('.colorpicker-patch')
        });

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

        this.renderer.tick();
    }

    /**
     *  This initializes the renderer. It uses requestAnimationFrame() to
     *  smoothly render changes in the color picker as user interacts with it.
     */
    initRenderer () {
        this.renderer = {
            // Stores a reference to the animation rendering loop.
            frame: null,

            // Animates one frame of activity. Call this directly if you do not
            // need it to go into the animation rendering loop.
            tick: () => {
                this.renderTestPatch();
                this.renderHSVPicker();
            },

            // Starts animation rendering loop
            start: () => {
                this.renderer.tick();
                this.renderer.frame = window.requestAnimationFrame(this.renderer.start);
            },

            // Stops animation rendering loop
            stop: () => {
                window.cancelAnimationFrame(this.renderer.frame);
            }
        }
    }

    /* ---------------------------------- */
    /* ---- HSV-circle color picker ----- */
    /* ---------------------------------- */

    hsvDown (event) { // mouseDown callback
        let target = event.target || event.srcElement;

        if (event.preventDefault) event.preventDefault();

        currentTarget = target.id ? target : target.parentNode;
        startPoint = Tools.getOrigin(currentTarget);
        currentTargetHeight = currentTarget.offsetHeight; // as diameter of circle

        Tools.addEvent(window, 'mousemove', this.hsvMove.bind(this));
        hsv_map.classList.add('colorpicker-no-cursor');
        this.hsvMove(event);

        this.renderer.start();
    }

    hsvMove (e) { // mouseMove callback
        let r, x, y, h, s;

        if (currentTarget === hsv_map) { // the circle
            r = currentTargetHeight / 2,
            x = e.clientX - startPoint.left - r,
            y = e.clientY - startPoint.top - r,
            h = 360 - ((Math.atan2(y, x) * 180 / Math.PI) + (y < 0 ? 360 : 0)),
            s = (Math.sqrt((x * x) + (y * y)) / r) * 100;
            this.lib.setColor({h: h, s: s}, 'hsv');
        } else if (currentTarget === hsv_barCursors) { // the luminanceBar
            this.lib.setColor({
                v: (currentTargetHeight - (e.clientY - startPoint.top)) / currentTargetHeight * 100
            }, 'hsv');
        }

        // fire 'changed'
        if (listeners.changed && typeof listeners.changed === 'function') {
            listeners.changed();
        }
    }

    /**
     *  Render color patch
     */
    renderTestPatch () {
        let patch = this.el.querySelector('.colorpicker-patch');
        let color = this.lib.colors;
        let RGB = color.RND.rgb;
        patch.style.backgroundColor = 'rgb(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ')';
    }

    /**
     *  Render HSV picker
     */
    renderHSVPicker () {
        let color = this.lib.colors;
        let pi2 = Math.PI * 2;
        let x = Math.cos(pi2 - color.hsv.h * pi2);
        let y = Math.sin(pi2 - color.hsv.h * pi2);
        let r = color.hsv.s * (colorDiscRadius - 5);

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
    }

    // Monkey patches for Thistle.js functionality

    /**
     *  Execute a callback for a fired event listener
     */
    on (type, callback) {
        listeners[type] = callback;
    }

    /**
     *  Returns CSS hex value of the current color
     */
    getCSS () {
        return '#' + this.lib.colors.HEX.toLowerCase();
    }

    /**
     *  Returns RGB object of the current color
     *  TODO: Streamline format between end use and what this returns
     */
    getRGB () {
        const RND = this.lib.colors.RND;
        return {
            r: RND.rgb.r / 255,
            g: RND.rgb.g / 255,
            b: RND.rgb.b / 255
        };
    }

    // Not from Thistle.js, but example helper functions for getting color values.
    // These are retained from old ColorPicker - not currently used anywhere...

    /**
     *  Gets CSS color strings for output
     */
    getColorValues () {
        const color = this.lib.colors;
        const RND = this.lib.colors.RND;

        return {
            hex: '#' + color.HEX,
            rgb: 'rgb(' + RND.rgb.r  + ',' + RND.rgb.g  + ',' + RND.rgb.b  + ')',
            rgba: 'rgba(' + RND.rgb.r  + ',' + RND.rgb.g  + ',' + RND.rgb.b  + ',' + color.alpha + ')',
            hsl: 'hsl(' + RND.hsl.h  + ',' + RND.hsl.s  + ',' + RND.hsl.l  + ')',
            hsla: 'hsla(' + RND.hsl.h  + ',' + RND.hsl.s  + ',' + RND.hsl.l  + ',' + color.alpha + ')',
        };
    }

    /**
     *  Returns true if the color is bright
     *  Helps determine which contrasting text color you need
     */
    isBright () {
        return (this.lib.colors.rgbaMixBlack.luminance > 0.22) ? true : false;
    }
}

// generic function for drawing a canvas disc
function drawDisk (ctx, coords, radius, steps, colorCallback) {
    let x = coords[0] || coords; // coordinate on x-axis
    let y = coords[1] || coords; // coordinate on y-axis
    let a = radius[0] || radius; // radius on x-axis
    let b = radius[1] || radius; // radius on y-axis
    let angle = 360;
    let rotate = 0;
    let coef = Math.PI / 180;

    ctx.save();
    ctx.translate(x - a, y - b);
    ctx.scale(a, b);

    steps = (angle / steps) || 360;

    for (; angle > 0 ; angle -= steps) {
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

function drawCircle (ctx, coords, radius, color, width) { // uses drawDisk
    width = width || 1;
    radius = [
        (radius[0] || radius) - width / 2,
        (radius[1] || radius) - width / 2
    ];
    drawDisk(ctx, coords, radius, 1, function (ctx, angle) {
        ctx.restore();
        ctx.lineWidth = width;
        ctx.strokeStyle = color || '#000';
        ctx.stroke();
    });
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
    let modal = document.querySelector('.colorpicker-modal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }

    window.removeEventListener('click', _onClickOutsideElement, false);
}
