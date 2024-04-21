"use strict";
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGlobalLogger = exports.log = void 0;
// @ts-ignore
class NullLogger {
    constructor() {
        this.ERROR_MESSAGE = 'NullLogger does not support. Instantiate a valid logger using "setGlobalLogger"';
        this.src = true;
    }
    addStream(_stream) {
        throw new Error(this.ERROR_MESSAGE);
    }
    addSerializers(_serializers) {
        throw new Error(this.ERROR_MESSAGE);
    }
    child(_options, _simple) {
        return this;
    }
    reopenFileStreams() {
        throw new Error(this.ERROR_MESSAGE);
    }
    level(_value) {
        return;
    }
    levels(_name, _value) {
        return;
    }
    trace(..._rest) {
        return true;
    }
    debug(..._rest) {
        return true;
    }
    info(..._rest) {
        return true;
    }
    warn(..._rest) {
        return true;
    }
    error(..._rest) {
        return true;
    }
    fatal(..._rest) {
        return true;
    }
    addListener(_event, _listener) {
        throw new Error(this.ERROR_MESSAGE);
    }
    on(_event, _listener) {
        throw new Error(this.ERROR_MESSAGE);
    }
    once(_event, _listener) {
        throw new Error(this.ERROR_MESSAGE);
    }
    removeListener(_event, _listener) {
        throw new Error(this.ERROR_MESSAGE);
    }
    off(_event, _listener) {
        throw new Error(this.ERROR_MESSAGE);
    }
    removeAllListeners(_event) {
        throw new Error(this.ERROR_MESSAGE);
    }
    setMaxListeners(_n) {
        throw new Error(this.ERROR_MESSAGE);
    }
    getMaxListeners() {
        throw new Error(this.ERROR_MESSAGE);
    }
    listeners(_event) {
        throw new Error(this.ERROR_MESSAGE);
    }
    rawListeners(_event) {
        throw new Error(this.ERROR_MESSAGE);
    }
    emit(_event, ..._args) {
        throw new Error(this.ERROR_MESSAGE);
    }
    listenerCount(_event) {
        throw new Error(this.ERROR_MESSAGE);
    }
    prependListener(_event, _listener) {
        throw new Error(this.ERROR_MESSAGE);
    }
    prependOnceListener(_event, _listener) {
        throw new Error(this.ERROR_MESSAGE);
    }
    eventNames() {
        throw new Error(this.ERROR_MESSAGE);
    }
}
exports.log = new NullLogger();
// export let log: Logger = Logger.createLogger({
//   name: 'myapp',
//   streams: [
//     {
//       // stream: process.stdout,
//       path: './logs/myapp.log'        // log INFO and above to stdout
//     },
//     {
//       level: 'error',
//       path: './logs/myapperr.log' // log ERROR and// log ERROR and above to a file
//     }
//   ]
// });
const setGlobalLogger = (_log) => {
    exports.log = _log;
};
exports.setGlobalLogger = setGlobalLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWwvbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxvQkFBb0I7OztBQUlwQixhQUFhO0FBQ2IsTUFBTSxVQUFVO0lBQWhCO1FBQ1Usa0JBQWEsR0FDbkIsaUZBQWlGLENBQUM7UUF5QnBGLFFBQUcsR0FBRyxJQUFJLENBQUM7SUFvR2IsQ0FBQztJQTVIQyxTQUFTLENBQUMsT0FBc0I7UUFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELGNBQWMsQ0FBQyxZQUFnQztRQUM3QyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsS0FBSyxDQUFDLFFBQWdCLEVBQUUsT0FBaUI7UUFDdkMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0QsaUJBQWlCO1FBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUdELEtBQUssQ0FBQyxNQUFZO1FBQ2hCLE9BQU87SUFDVCxDQUFDO0lBSUQsTUFBTSxDQUFDLEtBQVcsRUFBRSxNQUFZO1FBQzlCLE9BQU87SUFDVCxDQUFDO0lBT0QsS0FBSyxDQUFDLEdBQUcsS0FBVTtRQUNqQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFLRCxLQUFLLENBQUMsR0FBRyxLQUFVO1FBQ2pCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUtELElBQUksQ0FBQyxHQUFHLEtBQVU7UUFDaEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBS0QsSUFBSSxDQUFDLEdBQUcsS0FBVTtRQUNoQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFLRCxLQUFLLENBQUMsR0FBRyxLQUFVO1FBQ2pCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUtE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