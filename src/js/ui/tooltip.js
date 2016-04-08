const TIME_BEFORE_DISPLAY = 500; // in milliseconds, the amount of time elapsed before a tooltip is shown
const TIME_BEFORE_RESET = 100; // in milliseconds, the amount of time elapsed after a tooltip disappears that it should appear to animate in instead of appearing instantly
const VIEWPORT_EDGE_BUFFER = 6; // in pixels, minimum distance the edge of a tooltip should be from edge of the viewport

let isCurrentlyShowing = false;
let displayTimer = false;
let target = null;
let tooltipEl = null;
let pointerEl = null;
let contentEl = null;

initTooltip();

function initTooltip () {
    // Create tooltip DOM element and append to page
    tooltipEl = createTooltipDOM();
    document.body.appendChild(tooltipEl);

    // Cache references to child elements
    pointerEl = tooltipEl.querySelector('.tooltip-pointer');
    contentEl = tooltipEl.querySelector('.tooltip-content');

    // Look for any tooltips in DOM and attach
    // event listeners immediately.
    let els = document.querySelectorAll('[data-tooltip]');
    for (let el of els) {
        setupTooltipTarget(el);
    }
}

function setupTooltipTarget (target) {
    // Given a DOM target, set up mouse events on it
    // This is automatically called on init() for all targets
    // that already have the [data-tooltip] attribute on it
    // If you dynamically create elements that require a tooltip,
    // call this specifically for those elements.
    target.addEventListener('mouseenter', (e) => {
        considerShowingTooltip(target);
    }, false);

    target.addEventListener('mouseleave', (e) => {
        hideTooltip();
    }, false);
}

function considerShowingTooltip (el) {
    // Do not show if target element has disabled the tooltip
    if (el.getAttribute('data-tooltip-state') === 'disabled') {
        return;
    }

    // Assign current target element
    target = el;

    // If tooltips are already visible, just show the next one immediately
    if (isCurrentlyShowing === true) {
        showTooltip();
    }
    // Otherwise, there is a slight delay, and an animation
    else {
        displayTimer = window.setTimeout(() => {
            tooltipEl.classList.add('tooltip-animate');
            showTooltip();
        }, TIME_BEFORE_DISPLAY);
    }
}

function showTooltip () {
    // Set the tooltip's message and position based on target element
    contentEl.textContent = target.getAttribute('data-tooltip');
    applyTooltipPosition();

    // Force browsers to end batch reflow computation so that animations work
    window.setTimeout(() => {
        window.getComputedStyle(tooltipEl).cssText;
        tooltipEl.classList.add('tooltip-show');
    }, 0);

    // Set tooltip management state
    isCurrentlyShowing = true;

    window.addEventListener('click', hideTooltip, false);
}

function hideTooltip () {
    // Better to clear this timer on hide
    window.clearTimeout(displayTimer);

    tooltipEl.classList.remove('tooltip-show');

    // Reset active state after some amount of time, if it is not being shown elsewhere
    window.setTimeout(() => {
        if (!tooltipEl.classList.contains('tooltip-show')) {
            isCurrentlyShowing = false;
        }
    }, TIME_BEFORE_RESET);

    window.removeEventListener('click', hideTooltip, false);
}

function applyTooltipPosition () {
    const targetPos = target.getBoundingClientRect();
    const alignment = target.getAttribute('data-tooltip-alignment') || 'left';

    if (alignment === 'right') {
        let rightXPos = (targetPos.right + VIEWPORT_EDGE_BUFFER < window.innerWidth) ? targetPos.right : (window.innerWidth - VIEWPORT_EDGE_BUFFER);
        tooltipEl.style.right = Math.floor(window.innerWidth - rightXPos) + 'px';
        tooltipEl.style.left = 'auto';
        pointerEl.classList.add('tooltip-pointer-right');
    }
    else {
        let leftXPos = (targetPos.left - VIEWPORT_EDGE_BUFFER > 0) ? targetPos.left : VIEWPORT_EDGE_BUFFER;
        tooltipEl.style.left = Math.floor(leftXPos) + 'px';
        tooltipEl.style.right = 'auto';
        pointerEl.classList.remove('tooltip-pointer-right');
    }

    tooltipEl.style.top = Math.floor(targetPos.bottom + 5) + 'px'; // Starting position, animate down
}

function createTooltipDOM () {
    const dom = document.createElement('div');
    const tooltipEl = document.createElement('div');
    const pointerEl = document.createElement('div');

    tooltipEl.className = 'tooltip-content';
    pointerEl.className = 'tooltip-pointer';

    dom.className = 'tooltip';
    dom.appendChild(tooltipEl);
    dom.appendChild(pointerEl);

    // Attach an event listener to remove animation class
    // if present, after the animation itself has completed.
    dom.addEventListener('transitionend', function () {
        dom.classList.remove('tooltip-animate');
    });

    return dom;
}
