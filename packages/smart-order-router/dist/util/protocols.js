"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TO_PROTOCOL = void 0;
const router_sdk_1 = require("@uniswap/router-sdk");
const TO_PROTOCOL = (protocol) => {
    switch (protocol.toLowerCase()) {
        case 'v3':
            return router_sdk_1.Protocol.V3;
        case 'v2':
            return router_sdk_1.Protocol.V2;
        case 'mixed':
            return router_sdk_1.Protocol.MIXED;
        default:
            throw new Error(`Unknown protocol: {id}`);
    }
};
exports.TO_PROTOCOL = TO_PROTOCOL;
