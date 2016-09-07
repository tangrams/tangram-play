const EventEmitter = {
    // Never access the `events` property directly.
    events: {},
    dispatch(event, data) {
        if (!this.events[event]) {
            return; // no one is listening to this event
        }
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i](data);
        }
    },
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = []; // new event
        }
        this.events[event].push(callback);
    },
    unsubscribe(event, callback) {
        if (!this.events[event]) {
            return; // unsubscribing from an event that doesn't exist
        }
        for (let i = 0; i < this.events[event].length; i++) {
            if (this.events[event][i] === callback) {
                this.events[event].splice(i, 1); // removes it from event stack
            }
        }
    },
};

export default EventEmitter;
