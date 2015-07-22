export default class Widget {
    constructor (datum) {
        const matchTypes = [
            'value',
            'key',
            'address',
        ];

        for (const key of matchTypes) {
            if (datum[key]) {
                this.matchAgainst = key;
                this.matchPattern = datum[key];
                break;
            }
        }
    }

    match (keyPair) {
        if (this.matchAgainst) {
            return RegExp(this.matchPattern).test(keyPair[this.matchAgainst]);
        }
        else {
            return false;
        }
    }

    wrap (dom, keyPair) {
        return {
            dom,
            line: keyPair.pos.line,
            index: keyPair.index
        };
    }
}
