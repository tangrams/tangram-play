'use strict';

const TIME_BEFORE_DISPLAY = 500; // in milliseconds, the amount of time elapsed before a tooltip is shown
const TIME_BEFORE_RESET = 100; // in milliseconds, the amount of time elapsed after a tooltip disappears that it should appear to animate in instead of appearing instantly
const VIEWPORT_EDGE_BUFFER = 6; // in pixels, minimum distance the edge of a tooltip should be from edge of the viewport

const Tooltip = {
    // Declare variables for tooltip lifetime management
    isCurrentlyShowing: false,
    displayTimer: null,
    target: null,
    el: null,

    init () {
        // Create tooltip DOM element and append to page
        this.el = createDom();
        document.body.appendChild(this.el);

        // Cache references to child elements
        this.pointerEl = this.el.querySelector('.tp-tooltip-pointer');
        this.contentEl = this.el.querySelector('.tp-tooltip-content');

        // Look for any tooltips in DOM and attach
        // event listeners immediately.
        let els = document.querySelectorAll('[data-tooltip]');
        for (let el of els) {
            this.setupTarget(el);
        }
    },

    setupTarget (target) {
        // Given a DOM target, set up mouse events on it
        // This is automatically called on init() for all targets
        // that already have the [data-tooltip] attribute on it
        // If you dynamically create elements that require a tooltip,
        // call this specifically for those elements.
        target.addEventListener('mouseenter', (e) => {
            Tooltip.considerShowing(target);
        }, false);

        target.addEventListener('mouseleave', (e) => {
            Tooltip.hide();
        }, false);
    },

    considerShowing (target) {
        // Do not show if target has disabled the tooltip
        if (target.getAttribute('data-tooltip-state') === 'disabled') {
            return;
        }

        // Assign current target element
        this.target = target;

        // If tooltips are already visible, just show the next one immediately
        if (this.isCurrentlyShowing === true) {
            this.show();
        }
        // Otherwise, there is a slight delay, and an animation
        else {
            this.displayTimer = window.setTimeout(() => {
                this.el.classList.add('tp-tooltip-animate');
                this.show();
            }, TIME_BEFORE_DISPLAY);
        }
    },

    show () {
        // Set the tooltip's message and position based on target element
        this.contentEl.textContent = this.target.getAttribute('data-tooltip');
        this.applyPosition();

        // Force browsers to end batch reflow computation so that animations work
        window.setTimeout(() => {
            window.getComputedStyle(this.el).cssText;
            this.el.classList.add('tp-tooltip-show');
        }, 0);

        // Set tooltip management state
        this.isCurrentlyShowing = true;

        // Set global listener to hide a tooltip on click
        this._globalEventHandler = (e) => {
            this.hide();
        };
        window.addEventListener('click', this._globalEventHandler, false);
    },

    hide () {
        // Better to clear this timer on hide
        window.clearTimeout(this.displayTimer);

        this.el.classList.remove('tp-tooltip-show');

        // Reset active state after some amount of time, if it is not being shown elsewhere
        window.setTimeout(() => {
            if (!this.el.classList.contains('tp-tooltip-show')) {
                this.isCurrentlyShowing = false;
            }
        }, TIME_BEFORE_RESET);

        window.removeEventListener('click', this._globalEventHandler, false);
    },

    applyPosition () {
        const targetPos = this.target.getBoundingClientRect();
        const alignment = this.target.getAttribute('data-tooltip-alignment') || 'left';

        if (alignment === 'right') {
            let rightXPos = (targetPos.right + VIEWPORT_EDGE_BUFFER < window.innerWidth) ? targetPos.right : (window.innerWidth - VIEWPORT_EDGE_BUFFER);
            this.el.style.right = Math.floor(window.innerWidth - rightXPos) + 'px';
            this.el.style.left = 'auto';
            this.pointerEl.classList.add('tp-tooltip-pointer-right');
        }
        else {
            let leftXPos = (targetPos.left - VIEWPORT_EDGE_BUFFER > 0) ? targetPos.left : VIEWPORT_EDGE_BUFFER;
            this.el.style.left = Math.floor(leftXPos) + 'px';
            this.el.style.right = 'auto';
            this.pointerEl.classList.remove('tp-tooltip-pointer-right');
        }

        this.el.style.top = Math.floor(targetPos.bottom + 5) + 'px'; // Starting position, animate down
    }
};

export default Tooltip;

function createDom () {
    let dom = document.createElement('div');
    let tooltipEl = document.createElement('div');
    let pointerEl = document.createElement('div');

    tooltipEl.className = 'tp-tooltip-content';
    pointerEl.className = 'tp-tooltip-pointer';

    dom.className = 'tp-tooltip';
    dom.appendChild(tooltipEl);
    dom.appendChild(pointerEl);

    // Attach an event listener to remove animation class
    // if present, after the animation itself has completed.
    dom.addEventListener('transitionend', function () {
        dom.classList.remove('tp-tooltip-animate');
    });

    return dom;
}
