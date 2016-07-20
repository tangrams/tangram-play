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

//  Check if a variable is a number
export function isNumber (n) {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
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
