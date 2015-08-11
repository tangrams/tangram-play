'use strict';

const TIME_BEFORE_DISPLAY = 500; // in milliseconds, the amount of time elapsed before a tooltip is shown
const TIME_BEFORE_RESET = 100; // in milliseconds, the amount of time elapsed after a tooltip disappears that it should appear to animate in instead of appearing instantly

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
    },

    considerShowing (target) {
        // Do not show if target has disabled the tooltip
        if (target.getAttribute('data-tooltip-state') === 'disabled') {
            return;
        }

        // Assign target element
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
        window.addEventListener('click', (e) => {
            this.hide();
        }, false);
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

        window.removeEventListener('click', (e) => {
            this.hide();
        }, false);
    },

    applyPosition () {
        const targetPos = this.target.getBoundingClientRect();
        const alignment = this.target.getAttribute('data-tooltip-alignment') || 'left';

        if (alignment === 'right') {
            // Momentarily, this is aligned to right side of window (with some margin)
            // rather than right side of element position.
            // This will need to change if / when there are more menu items to the
            // right (or adjusted for arbitrary positioning so that elements do not
            // disappear out of the viewport.)
            this.el.style.right = '6px';
            this.el.style.left = 'auto';
            this.pointerEl.classList.add('tp-tooltip-pointer-right');
        }
        else {
            this.el.style.left = Math.floor(targetPos.left) + 'px';
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
