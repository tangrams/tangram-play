export const EventEmitter = {
    _events: {},
    dispatch: function (event, data) {
        if (!this._events[event]) {
            return; // no one is listening to this event
        }
        for (var i = 0; i < this._events[event].length; i++) {
            this._events[event][i](data);
        }
    },
    subscribe: function (event, callback) {
        if (!this._events[event]) {
            this._events[event] = []; // new event
        }
        this._events[event].push(callback);
    },
    unsubscribe: function (event, callback) {
        if (!this._events[event]) {
            return; // unsubscribing from an event that doesn't exist
        }
        for (var i = 0; i < this._events[event].length; i++) {
            if (this._events[event][i] === callback) {
                this._events[event].splice(i, 1); // removes it from event stack
            }
        }
    }
};
