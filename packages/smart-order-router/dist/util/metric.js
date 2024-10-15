"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGlobalMetric = exports.metric = exports.MetricLogger = exports.IMetric = exports.MetricLoggerUnit = void 0;
const log_1 = require("./log");
var MetricLoggerUnit;
(function (MetricLoggerUnit) {
    MetricLoggerUnit["Seconds"] = "Seconds";
    MetricLoggerUnit["Microseconds"] = "Microseconds";
    MetricLoggerUnit["Milliseconds"] = "Milliseconds";
    MetricLoggerUnit["Bytes"] = "Bytes";
    MetricLoggerUnit["Kilobytes"] = "Kilobytes";
    MetricLoggerUnit["Megabytes"] = "Megabytes";
    MetricLoggerUnit["Gigabytes"] = "Gigabytes";
    MetricLoggerUnit["Terabytes"] = "Terabytes";
    MetricLoggerUnit["Bits"] = "Bits";
    MetricLoggerUnit["Kilobits"] = "Kilobits";
    MetricLoggerUnit["Megabits"] = "Megabits";
    MetricLoggerUnit["Gigabits"] = "Gigabits";
    MetricLoggerUnit["Terabits"] = "Terabits";
    MetricLoggerUnit["Percent"] = "Percent";
    MetricLoggerUnit["Count"] = "Count";
    MetricLoggerUnit["BytesPerSecond"] = "Bytes/Second";
    MetricLoggerUnit["KilobytesPerSecond"] = "Kilobytes/Second";
    MetricLoggerUnit["MegabytesPerSecond"] = "Megabytes/Second";
    MetricLoggerUnit["GigabytesPerSecond"] = "Gigabytes/Second";
    MetricLoggerUnit["TerabytesPerSecond"] = "Terabytes/Second";
    MetricLoggerUnit["BitsPerSecond"] = "Bits/Second";
    MetricLoggerUnit["KilobitsPerSecond"] = "Kilobits/Second";
    MetricLoggerUnit["MegabitsPerSecond"] = "Megabits/Second";
    MetricLoggerUnit["GigabitsPerSecond"] = "Gigabits/Second";
    MetricLoggerUnit["TerabitsPerSecond"] = "Terabits/Second";
    MetricLoggerUnit["CountPerSecond"] = "Count/Second";
    MetricLoggerUnit["None"] = "None";
})(MetricLoggerUnit = exports.MetricLoggerUnit || (exports.MetricLoggerUnit = {}));
class IMetric {
}
exports.IMetric = IMetric;
class MetricLogger extends IMetric {
    constructor(context) {
        super();
        this.log = log_1.log.child(context || {});
    }
    setProperty(key, value) {
        this.log = this.log.child({ [key]: value });
    }
    putDimensions(dimensions) {
        this.log = this.log.child(dimensions);
    }
    putMetric(key, value, unit) {
        this.log.info({ key, value, unit }, `[Metric]: ${key}: ${value} | ${unit ? unit : ''}`);
    }
}
exports.MetricLogger = MetricLogger;
exports.metric = new MetricLogger();
const setGlobalMetric = (_metric) => {
    exports.metric = _metric;
};
exports.setGlobalMetric = setGlobalMetric;
