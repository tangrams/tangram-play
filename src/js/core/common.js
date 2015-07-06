export function fetchHTTP(url, methood) {
    var request = new XMLHttpRequest(), response;

    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            response = request.responseText;
        }
    }
    request.open(methood ? methood : 'GET', url, false);
    request.send();
    return response;
};

export function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

export function getPosition(dom) {
    var y = 0, x = 0;
    do {
        y += dom.offsetTop  || 0;
        x += dom.offsetLeft || 0;
        dom = dom.offsetParent;
    } while (dom);

    return {
        y: y,
        x: x
    };
};

//  Check if a variable is a number
export function isNumber(n) { 
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
};

export function toCSS(str) {
    var match = str.match(/\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\]/);
    if (match) {
        str = 'rgb(' + Math.round(match[1]*255)+","+
                        Math.round(match[2]*255)+","+
                        Math.round(match[3]*255)+")";
    } else if (isNumber(str)) {
        var val = Math.round( parseFloat(str)*255 );
        str = 'rgb('+val+","+val+","+val+")";
    } else if (/^\s*[\'|\"]#[0-9a-f]{3}(?:[0-9a-f]{3})?[\'|\"]\s*$/i.test(str)) {
        var value = /[\'|\"]([\w|\W|\s]+)[\'|\"]/gm.exec(str);
        return value ? value[1] : "";

    }
    return str;
};
