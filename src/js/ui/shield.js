const el = document.getElementById('shield');

export default class Shield {
    static show () {
        el.style.display = 'block';
    }

    static hide () {
        el.style.display = 'none';
    }
}
