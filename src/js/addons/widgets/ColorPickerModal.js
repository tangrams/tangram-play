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

        // TODO: Improve these references
        // The caching of references is likely to be important for speed
        this.dom.hsvMap = this.el.querySelector('.colorpicker-hsv-map');
        this.dom.hsvMapCover = this.dom.hsvMap.children[1]; // well...
        this.dom.hsvMapCursor = this.dom.hsvMap.children[2];
        this.dom.hsvBarBGLayer = this.dom.hsvMap.children[3];
        this.dom.hsvBarWhiteLayer = this.dom.hsvMap.children[4];
        this.dom.hsvBarCursors = this.dom.hsvMap.children[6];
        this.dom.hsvLeftCursor = this.dom.hsvBarCursors.children[0];
        this.dom.hsvRightCursor = this.dom.hsvBarCursors.children[1];

        this.dom.colorDisc = this.el.querySelector('.colorpicker-disc');
        this.dom.luminanceBar = this.el.querySelector('.colorpicker-bar-luminance');
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
        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
        document.body.appendChild(this.dom);

        // Listen for interaction on the HSV map
        Tools.addEvent(this.dom.hsvMap, 'mousedown', this.hsvDown.bind(this));

        // Listen for interaction outside of the modal
        // TODO: Should this also be added through Tools ?
        window.setTimeout(function () {
            document.body.addEventListener('click', _onClickOutsideElement, false);
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

        let colorDisc = this.dom.colorDisc;

        if (colorDisc.getContext) {
            drawDisk( // HSV color wheel with white center
                colorDisc.getContext("2d"),
                [colorDisc.width / 2, colorDisc.height / 2],
                [colorDisc.width / 2 - 1, colorDisc.height / 2 - 1],
                360,
                function (ctx, angle) {
                    let gradient = ctx.createRadialGradient(1, 1, 1, 1, 1, 0);
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
            let ctx = this.dom.luminanceBar.getContext('2d');
            let gradient = ctx.createLinearGradient(0, 0, 0, 200);

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

    // Actions when user mouses down on HSV color map
    hsvDown (event) {
        let target = event.target || event.srcElement;

        if (event.preventDefault) event.preventDefault();

        currentTarget = target.id ? target : target.parentNode;
        startPoint = Tools.getOrigin(currentTarget);
        currentTargetHeight = currentTarget.offsetHeight; // as diameter of circle

        // Starts listening for mousemove and mouseup events
        Tools.addEvent(window, 'mousemove', this.hsvMove.bind(this));
        Tools.addEvent(window, 'mouseup', this.hsvUp.bind(this));

        this.hsvMove(event);

        // Hides mouse cursor and begins rendering loop
        this.dom.hsvMap.classList.add('colorpicker-no-cursor');
        this.renderer.start();
    }

    // Actions when user moves around on HSV color map
    hsvMove (event) {
        let r, x, y, h, s;

        if (currentTarget === this.dom.hsvMap) { // the circle
            r = currentTargetHeight / 2,
            x = event.clientX - startPoint.left - r,
            y = event.clientY - startPoint.top - r,
            h = 360 - ((Math.atan2(y, x) * 180 / Math.PI) + (y < 0 ? 360 : 0)),
            s = (Math.sqrt((x * x) + (y * y)) / r) * 100;
            this.lib.setColor({h: h, s: s}, 'hsv');
        } else if (currentTarget === this.dom.hsvBarCursors) { // the luminanceBar
            this.lib.setColor({
                v: (currentTargetHeight - (event.clientY - startPoint.top)) / currentTargetHeight * 100
            }, 'hsv');
        }

        // fire 'changed'
        if (listeners.changed && typeof listeners.changed === 'function') {
            listeners.changed();
        }
    }

    // Actions when user mouses up on HSV color map
    hsvUp (event) {
        // Stops rendering and returns mouse cursor
        this.renderer.stop();
        this.dom.hsvMap.classList.remove('colorpicker-no-cursor');

        // Destroy event listeners
        Tools.removeEvent(window, 'mousemove', this.hsvMove.bind(this));
        Tools.removeEvent(window, 'mouseup', this.hsvUp.bind(this));
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
        let colorDiscRadius = this.dom.colorDisc.offsetHeight / 2;
        let pi2 = Math.PI * 2;
        let x = Math.cos(pi2 - color.hsv.h * pi2);
        let y = Math.sin(pi2 - color.hsv.h * pi2);
        let r = color.hsv.s * (colorDiscRadius - 5);

        this.dom.hsvMapCover.style.opacity = 1 - color.hsv.v;
        // this is the faster version...
        this.dom.hsvBarWhiteLayer.style.opacity = 1 - color.hsv.s;
        this.dom.hsvBarBGLayer.style.backgroundColor = 'rgb(' +
            color.hueRGB.r + ',' +
            color.hueRGB.g + ',' +
            color.hueRGB.b + ')';

        this.dom.hsvMapCursor.style.cssText =
            'left: ' + (x * r + colorDiscRadius) + 'px;' +
            'top: ' + (y * r + colorDiscRadius) + 'px;' +
            'border-color: ' + (color.RGBLuminance > 0.22 ? '#333;' : '#ddd');

        if (color.RGBLuminance > 0.22) {
            this.dom.hsvBarCursors.classList.add('colorpicker-dark');
        }

        if (this.dom.hsvLeftCursor) this.dom.hsvLeftCursor.style.top = this.dom.hsvRightCursor.style.top = ((1 - color.hsv.v) * colorDiscRadius * 2) + 'px';
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
    // HACKY!!
    // A click event fires on the body after mousedown - mousemove, simultaneously with
    // mouseup. So if someone started a mouse action inside the color picker modal and then
    // mouseup'd outside of it, it fires a click event on the body, thus, causing the
    // modal to disappear when the user does not expect it to, since the mouse down event
    // did not start outside the modal.
    // There might be (or should be) a better way to track this, but right now, just cancel
    // the event if the target ends up being on the body directly rather than on one of the
    // other child elements.
    if (event.target === document.body) return;

    var target = event.target;

    while (target !== document.documentElement && !target.classList.contains('colorpicker-modal')) {
        target = target.parentNode;
    }

    if (!target.classList.contains('colorpicker-modal')) {
        _loseModalFocus();
        document.body.removeEventListener('click', _onClickOutsideElement, false);
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
}
