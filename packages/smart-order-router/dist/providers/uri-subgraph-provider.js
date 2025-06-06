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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.URISubgraphProvider = void 0;
const async_retry_1 = __importDefault(require("async-retry"));
const await_timeout_1 = __importDefault(require("await-timeout"));
const axios_1 = __importDefault(require("axios"));
const log_1 = require("../util/log");
/**
 * Gets subgraph pools from a URI. The URI shoudl contain a JSON
 * stringified array of V2SubgraphPool objects or V3SubgraphPool
 * objects.
 *
 * @export
 * @class URISubgraphProvider
 * @template TSubgraphPool
 */
class URISubgraphProvider {
    constructor(chainId, uri, timeout = 6000, retries = 2) {
        this.chainId = chainId;
        this.uri = uri;
        this.timeout = timeout;
        this.retries = retries;
    }
    getPools() {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.log.info({ uri: this.uri }, `About to get subgraph pools from URI ${this.uri}`);
            let allPools = [];
            yield (0, async_retry_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                const timeout = new await_timeout_1.default();
                const timerPromise = timeout.set(this.timeout).then(() => {
                    throw new Error(`Timed out getting pools from subgraph: ${this.timeout}`);
                });
                let response;
                /* eslint-disable no-useless-catch */
                try {
                    response = yield Promise.race([axios_1.default.get(this.uri), timerPromise]);
                }
                catch (err) {
                    throw err;
                }
                finally {
                    timeout.clear();
                }
                /* eslint-enable no-useless-catch */
                const { data: poolsBuffer, status } = response;
                if (status != 200) {
                    log_1.log.error({ response }, `Unabled to get pools from ${this.uri}.`);
                    throw new Error(`Unable to get pools from ${this.uri}`);
                }
                const pools = poolsBuffer;
                log_1.log.info({ uri: this.uri, chain: this.chainId }, `Got subgraph pools from uri. Num: ${pools.length}`);
                allPools = pools;
            }), {
                retries: this.retries,
                onRetry: (err, retry) => {
                    log_1.log.info({ err }, `Failed to get pools from uri ${this.uri}. Retry attempt: ${retry}`);
                },
            });
            return allPools;
        });
    }
}
exports.URISubgraphProvider = URISubgraphProvider;
