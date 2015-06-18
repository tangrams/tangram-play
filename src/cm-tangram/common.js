function fetchHTTP(url, methood){
    var request = new XMLHttpRequest(), response;

    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            response = request.responseText;
        }
    }
    request.open(methood ? methood : 'GET', url, false);
    request.send();
    return response;
}

function debounce(func, wait, immediate) {
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

function parseQuery(qstr){
  var query = {};
  var a = qstr.split('&');
  for (var i in a){
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
  }

  return query;
}

function parseFeatureFlags(query) {
    var qstr = query['featureFlags'];
    var flags = {};
    if (!qstr) return flags;
    var values = qstr.split(',');
    for (var i in values) {
        flags[values[i]] = true;
    }
    return flags;
}

function getPosition(dom) {
    var y = 0, x = 0;
    do {
        y += dom.offsetTop  || 0;
        x += dom.offsetLeft || 0;
        dom = dom.offsetParent;
    } while(dom);

    return {
        y: y,
        x: x
    };
};

function isNumber(n) {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
}

function toCSS(str){
    var match = str.match(/\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\]/);
    if (match) {
        str = 'rgb(' + Math.round(match[1]*255)+","+
                        Math.round(match[2]*255)+","+
                        Math.round(match[3]*255)+")";
    } else if (isNumber(str)){
        var val = Math.round( parseFloat(str)*255 );
        str = 'rgb('+val+","+val+","+val+")";
    }

    return str;
}
