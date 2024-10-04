import { MixedRouteSDK, Protocol, } from '@uniswap/router-sdk';
import { Route as V2RouteRaw } from '@uniswap/v2-sdk';
import { Route as V3RouteRaw, } from '@uniswap/v3-sdk';
export class V3Route extends V3RouteRaw {
    constructor() {
        super(...arguments);
        this.protocol = Protocol.V3;
    }
}
export class V2Route extends V2RouteRaw {
    constructor() {
        super(...arguments);
        this.protocol = Protocol.V2;
    }
}
export class MixedRoute extends MixedRouteSDK {
    constructor() {
        super(...arguments);
        this.protocol = Protocol.MIXED;
    }
}
export var SwapToRatioStatus;
(function (SwapToRatioStatus) {
    SwapToRatioStatus[SwapToRatioStatus["SUCCESS"] = 1] = "SUCCESS";
    SwapToRatioStatus[SwapToRatioStatus["NO_ROUTE_FOUND"] = 2] = "NO_ROUTE_FOUND";
    SwapToRatioStatus[SwapToRatioStatus["NO_SWAP_NEEDED"] = 3] = "NO_SWAP_NEEDED";
})(SwapToRatioStatus || (SwapToRatioStatus = {}));
export var SwapType;
(function (SwapType) {
    SwapType[SwapType["UNIVERSAL_ROUTER"] = 0] = "UNIVERSAL_ROUTER";
    SwapType[SwapType["SWAP_ROUTER_02"] = 1] = "SWAP_ROUTER_02";
})(SwapType || (SwapType = {}));
/**
 * Provides functionality for finding optimal swap routes on the Uniswap protocol.
 *
 * @export
 * @abstract
 * @class IRouter
 */
export class IRouter {
}
export class ISwapToRatio {
}
