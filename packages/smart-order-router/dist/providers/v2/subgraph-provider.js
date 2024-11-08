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
exports.V2SubgraphProvider = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const async_retry_1 = __importDefault(require("async-retry"));
const await_timeout_1 = __importDefault(require("await-timeout"));
const graphql_request_1 = require("graphql-request");
const lodash_1 = __importDefault(require("lodash"));
const log_1 = require("../../util/log");
const SUBGRAPH_URL_BY_CHAIN = {
    [sdk_core_1.ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-dev',
};
const threshold = 0.025;
const PAGE_SIZE = 1000; // 1k is max possible query size from subgraph.
class V2SubgraphProvider {
    constructor(chainId, retries = 2, timeout = 360000, rollback = true, pageSize = PAGE_SIZE) {
        this.chainId = chainId;
        this.retries = retries;
        this.timeout = timeout;
        this.rollback = rollback;
        this.pageSize = pageSize;
        const subgraphUrl = SUBGRAPH_URL_BY_CHAIN[this.chainId];
        if (!subgraphUrl) {
            throw new Error(`No subgraph url for chain id: ${this.chainId}`);
        }
        this.client = new graphql_request_1.GraphQLClient(subgraphUrl);
    }
    getPools(_tokenIn, _tokenOut, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let blockNumber = (providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber)
                ? yield providerConfig.blockNumber
                : undefined;
            // Due to limitations with the Subgraph API this is the only way to parameterize the query.
            const query2 = (0, graphql_request_1.gql) `
        query getPools($pageSize: Int!, $id: String) {
            pairs(
                first: $pageSize
                ${blockNumber ? `block: { number: ${blockNumber} }` : ``}
                where: { id_gt: $id }
            ) {
                id
                token0 { id, symbol }
                token1 { id, symbol }
                totalSupply
                trackedReserveETH
                reserveUSD
            }
        }
    `;
            let pools = [];
            log_1.log.info(`Getting V2 pools from the subgraph with page size ${this.pageSize}${(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber)
                ? ` as of block ${providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber}`
                : ''}.`);
            yield (0, async_retry_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                const timeout = new await_timeout_1.default();
                const getPools = () => __awaiter(this, void 0, void 0, function* () {
                    let lastId = '';
                    let pairs = [];
                    let pairsPage = [];
                    do {
                        yield (0, async_retry_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                            const poolsResult = yield this.client.request(query2, {
                                pageSize: this.pageSize,
                                id: lastId,
                            });
                            pairsPage = poolsResult.pairs;
                            pairs = pairs.concat(pairsPage);
                            lastId = pairs[pairs.length - 1].id;
                        }), {
                            retries: this.retries,
                            onRetry: (err, retry) => {
                                pools = [];
                                log_1.log.info({ err }, `Failed request for page of pools from subgraph. Retry attempt: ${retry}`);
                            },
                        });
                    } while (pairsPage.length > 0);
                    return pairs;
                });
                /* eslint-disable no-useless-catch */
                try {
                    const getPoolsPromise = getPools();
                    const timerPromise = timeout.set(this.timeout).then(() => {
                        throw new Error(`Timed out getting pools from subgraph: ${this.timeout}`);
                    });
                    pools = yield Promise.race([getPoolsPromise, timerPromise]);
                    return;
                }
                catch (err) {
                    throw err;
                }
                finally {
                    timeout.clear();
                }
                /* eslint-enable no-useless-catch */
            }), {
                retries: this.retries,
                onRetry: (err, retry) => {
                    if (this.rollback &&
                        blockNumber &&
                        // @ts-ignore
                        lodash_1.default.includes(err.message, 'indexed up to')) {
                        blockNumber = blockNumber - 10;
                        log_1.log.info(`Detected subgraph indexing error. Rolled back block number to: ${blockNumber}`);
                    }
                    pools = [];
                    log_1.log.info({ err }, `Failed to get pools from subgraph. Retry attempt: ${retry}`);
                },
            });
            // Filter pools that have tracked reserve ETH less than threshold.
            // trackedReserveETH filters pools that do not involve a pool from this allowlist:
            // https://github.com/Uniswap/v2-subgraph/blob/7c82235cad7aee4cfce8ea82f0030af3d224833e/src/mappings/pricing.ts#L43
            // Which helps filter pools with manipulated prices/liquidity.
            // TODO: Remove. Temporary fix to ensure tokens without trackedReserveETH are in the list.
            const FEI = '0x956f47f50a910163d8bf957cf5846d573e7f87ca';
            const poolsSanitized = pools
                .filter((pool) => {
                return (pool.token0.id == FEI ||
                    pool.token1.id == FEI ||
                    parseFloat(pool.trackedReserveETH) > threshold);
            })
                .map((pool) => {
                return Object.assign(Object.assign({}, pool), { id: pool.id.toLowerCase(), token0: {
                        id: pool.token0.id.toLowerCase(),
                    }, token1: {
                        id: pool.token1.id.toLowerCase(),
                    }, supply: parseFloat(pool.totalSupply), reserve: parseFloat(pool.trackedReserveETH), reserveUSD: parseFloat(pool.reserveUSD) });
            });
            log_1.log.info(`Got ${pools.length} V2 pools from the subgraph. ${poolsSanitized.length} after filtering`);
            return poolsSanitized;
        });
    }
}
exports.V2SubgraphProvider = V2SubgraphProvider;
