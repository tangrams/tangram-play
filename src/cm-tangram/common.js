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
    var qstr = query['flags'];
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

//  Check if a variable is a number
function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); }

//  Check if a str ends with a suffix
function endsWith(str, suffix) { return str.indexOf(suffix, str.length - suffix.length) !== -1;}

function toCSS(str){
    var match = str.match(/\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\]/);
    if (match) {
        str = 'rgb(' + Math.round(match[1]*255)+","+
                        Math.round(match[2]*255)+","+
                        Math.round(match[3]*255)+")";
    } else if (isNumber(str)){
        var val = Math.round( parseFloat(str)*255 );
        str = 'rgb('+val+","+val+","+val+")";
    } else if ( /^\s*[\'|\"]#[0-9a-f]{3}(?:[0-9a-f]{3})?[\'|\"]\s*$/i.test(str) ){
        var value = /[\'|\"]([\w|\W|\s]+)[\'|\"]/gm.exec( str );
        return value ? value[1] : "" ;

    }

    return str;
}

function isMobile () {
  if (/iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(navigator.userAgent.toLowerCase()))
    return true;
  else
    return false;
}
