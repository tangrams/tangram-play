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

export function toCSS (str) {
    let match = str.match(/\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*(,\s*(\d\.|\d*\.?\d+)\s*)?\]/);
    if (match) {
        if (match[5]) {
            str = 'rgba(' + Math.round(match[1] * 255) + ',' +
                            Math.round(match[2] * 255) + ',' +
                            Math.round(match[3] * 255) + ',' +
                            Math.round(match[5] * 255) + ')';
        }
        else {
            str = 'rgb(' + Math.round(match[1] * 255) + ',' +
                            Math.round(match[2] * 255) + ',' +
                            Math.round(match[3] * 255) + ')';
        }
    }
    else if (isNumber(str)) {
        let val = Math.round(parseFloat(str) * 255);
        str = 'rgb(' + val + ',' + val + ',' + val + ')';
    }
    else if (/^\s*['|"]#[0-9a-f]{3}(?:[0-9a-f]{3})?['|"]\s*$/i.test(str)) {
        let value = /['|"]([\w|\W|\s]+)['|"]/gm.exec(str);
        return value ? value[1] : '';
    }
    else if (/'(\w+)'/.test(str)) {
        let value = /['|"]([\w|\W|\s]+)['|"]/gm.exec(str);
        return value ? value[1] : '';
    }
    return str;
}

export function toColorVec (str) {
    let match = str.match(/\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*(,\s*(\d\.|\d*\.?\d+)\s*)?\]/);
    if (match) {
        if (match[5]) {
            return { r: match[1], g: match[2], b: match[3], a: match[5] };
        }
        else {
            return { r: match[1], g: match[2], b: match[3] };
        }
    }
    else if (isNumber(str)) {
        let val = parseFloat(str);
        return { r: val, g: val, b: val };
    }
    else if (/^\s*['|"]#[0-9a-f]{3}(?:[0-9a-f]{3})?['|"]\s*$/i.test(str)) {
        let value = /['|"]([\w|\W|\s]+)['|"]/gm.exec(str);
        return value ? { w: value[1] } : {};
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
