export function httpGet (url, callback) {
    let request = new XMLHttpRequest();
    let method = 'GET';

    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            let response = request.responseText;

            // TODO: Actual error handling
            let error = null;
            callback(error, response);
        }
    };
    request.open(method, url, true);
    request.send();
}

export function debounce (func, wait, immediate) {
    let timeout;
    return function () {
        let context = this;
        let args = arguments;
        let later = function () {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}

export function getDOMOffset (dom) {
    let y = 0;
    let x = 0;
    do {
        y += dom.offsetTop || 0;
        x += dom.offsetLeft || 0;
        dom = dom.offsetParent;
    } while (dom);

    return {
        y: y,
        x: x
    };
}

//  Check if a variable is a number
export function isNumber (n) {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
}

export class StopWatch {
    constructor (performance) {
        this.startTime = 0;
        this.stopTime = 0;
        this.running = false;
        this.performance = performance === false ? false : !window.performance;
    }

    currentTime () {
        return this.performance ? window.performance.now() : new Date().getTime();
    }

    start () {
        this.startTime = this.currentTime();
        this.running = true;
    }

    stop () {
        this.stopTime = this.currentTime();
        this.running = false;
    }

    getElapsedMilliseconds () {
        if (this.running) {
            this.stopTime = this.currentTime();
        }
        return this.stopTime - this.startTime;
    }

    getElapsedSeconds () {
        return this.getElapsedMilliseconds() / 1000;
    }

    printElapsed (name) {
        let currentName = name || 'Elapsed:';
        console.log(currentName, '[' + this.getElapsedMilliseconds() + 'ms]', '[' + this.getElapsedSeconds() + 's]');
    }
}

export function getDevicePixelRatio (ctx) {
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1;
    return devicePixelRatio / backingStoreRatio;
}

export function createObjectURL (string) {
    let create = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
    return create(new Blob([string]));
}
