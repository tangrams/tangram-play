export default class Widget {
    constructor (datum) {
        //  TODO: must be a better way to do this
        if ( datum['address'] ) {
            this.checkAgainst = 'address';
        }
        else if ( datum['key'] ) {
            this.checkAgainst = 'key';
        }
        else if ( datum['value'] ) {
            this.checkAgainst = 'value';
        }
        this.checkPattern = datum[this.checkAgainst];
    }

    check (keyPair) {
        if (this.checkAgainst) {
            return RegExp(this.checkPattern).test(keyPair[this.checkAgainst]);
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
