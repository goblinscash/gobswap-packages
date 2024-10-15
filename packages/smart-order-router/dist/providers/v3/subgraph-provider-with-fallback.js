"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V3SubgraphProviderWithFallBacks = void 0;
const util_1 = require("../../util");
/**
 * Provider for getting V3 subgraph pools that falls back to a different provider
 * in the event of failure.
 *
 * @export
 * @class V3SubgraphProviderWithFallBacks
 */
class V3SubgraphProviderWithFallBacks {
    constructor(fallbacks) {
        this.fallbacks = fallbacks;
    }
    getPools(tokenIn, tokenOut, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < this.fallbacks.length; i++) {
                const provider = this.fallbacks[i];
                try {
                    const pools = yield provider.getPools(tokenIn, tokenOut, providerConfig);
                    return pools;
                }
                catch (err) {
                    util_1.log.info(`Failed to get subgraph pools for V3 from fallback #${i}`);
                }
            }
            throw new Error('Failed to get subgraph pools from any providers');
        });
    }
}
exports.V3SubgraphProviderWithFallBacks = V3SubgraphProviderWithFallBacks;
