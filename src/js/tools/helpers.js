export function returnTrue () {}

export function parseQuery (qstr) {
    let query = {};
    let a = qstr.split('&');
    for (let i in a) {
        let b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
}

export function emptyDOMElement (el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
