
const selectionEl = buildDOM();

function buildDOM () {
    let el = document.createElement('div');
    el.style = 'width: 400px; height: calc(100% - 120px); overflow-x: hidden; overflow-y: auto; background-color: rgba(0,0,0,0.85); padding: 4px; color: white; position: fixed; z-index: 1000; top: 60px; right: 100px;';
    document.body.appendChild(el);
    let pre = document.createElement('pre');
    pre.style = 'margin: 0;';
    el.appendChild(pre);
    return pre;
}

export function handleSelectionEvent (selection) {
    // console.log(selection);
    // Sometimes there is a .error property.
    // .feature property is not guaranteed to exist.
    if (selection.feature) {
        let json = JSON.stringify(selection.feature, null, 4);
        selectionEl.textContent = json;
    }
}
