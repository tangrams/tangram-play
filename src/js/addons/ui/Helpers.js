const Helpers = {
    noop () {},

    returnTrue () {},

    parseQuery (qstr) {
        let query = {};
        let a = qstr.split('&');
        for (let i in a) {
            let b = a[i].split('=');
            query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
        }
        return query;
    }
};

export default Helpers;
