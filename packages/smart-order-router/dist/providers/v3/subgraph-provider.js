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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V3SubgraphProvider = exports.printV2SubgraphPool = exports.printV3SubgraphPool = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const async_retry_1 = __importDefault(require("async-retry"));
const await_timeout_1 = __importDefault(require("await-timeout"));
const graphql_request_1 = require("graphql-request");
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("../../util");
const printV3SubgraphPool = (s) => `${s.token0.id}/${s.token1.id}/${s.feeTier}`;
exports.printV3SubgraphPool = printV3SubgraphPool;
const printV2SubgraphPool = (s) => `${s.token0.id}/${s.token1.id}`;
exports.printV2SubgraphPool = printV2SubgraphPool;
const SUBGRAPH_URL_BY_CHAIN = {
    [sdk_core_1.ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    [sdk_core_1.ChainId.OPTIMISM]: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',
    [sdk_core_1.ChainId.ARBITRUM_ONE]: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',
    [sdk_core_1.ChainId.POLYGON]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
    [sdk_core_1.ChainId.CELO]: 'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo',
    [sdk_core_1.ChainId.GOERLI]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-gorli',
    [sdk_core_1.ChainId.BNB]: 'https://api.thegraph.com/subgraphs/name/ilyamk/uniswap-v3---bnb-chain',
    [sdk_core_1.ChainId.AVALANCHE]: 'https://api.thegraph.com/subgraphs/name/lynnshaoyu/uniswap-v3-avax',
    [sdk_core_1.ChainId.BASE]: 'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest',
    [sdk_core_1.ChainId.SMARTBCH]: 'https://gobswap.dfd.cash/graph/subgraphs/name/goblincash/uniswap-v3'
};
const PAGE_SIZE = 1000; // 1k is max possible query size from subgraph.
class V3SubgraphProvider {
    constructor(chainId, retries = 2, timeout = 30000, rollback = true) {
        this.chainId = chainId;
        this.retries = retries;
        this.timeout = timeout;
        this.rollback = rollback;
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
            const query = (0, graphql_request_1.gql) `
      query getPools($pageSize: Int!, $id: String) {
        pools(
          first: $pageSize
          ${blockNumber ? `block: { number: ${blockNumber} }` : ``}
          where: { id_gt: $id }
        ) {
          id
          token0 {
            symbol
            id
          }
          token1 {
            symbol
            id
          }
          feeTier
          liquidity
          totalValueLockedUSD
          totalValueLockedETH
        }
      }
    `;
            let pools = [];
            util_1.log.info(`Getting V3 pools from the subgraph with page size ${PAGE_SIZE}${(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber)
                ? ` as of block ${providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber}`
                : ''}.`);
            yield (0, async_retry_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                const timeout = new await_timeout_1.default();
                const getPools = () => __awaiter(this, void 0, void 0, function* () {
                    let lastId = '';
                    let pools = [];
                    let poolsPage = [];
                    do {
                        const poolsResult = yield this.client.request(query, {
                            pageSize: PAGE_SIZE,
                            id: lastId,
                        });
                        poolsPage = poolsResult.pools;
                        pools = pools.concat(poolsPage);
                        lastId = pools[pools.length - 1].id;
                    } while (poolsPage.length > 0);
                    return pools;
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
                        util_1.log.info(`Detected subgraph indexing error. Rolled back block number to: ${blockNumber}`);
                    }
                    pools = [];
                    util_1.log.info({ err }, `Failed to get pools from subgraph. Retry attempt: ${retry}`);
                },
            });
            const poolsSanitized = pools
                .filter((pool) => parseInt(pool.liquidity) > 0 ||
                parseFloat(pool.totalValueLockedETH) > 0.01)
                .map((pool) => {
                const { totalValueLockedETH, totalValueLockedUSD } = pool, rest = __rest(pool, ["totalValueLockedETH", "totalValueLockedUSD"]);
                return Object.assign(Object.assign({}, rest), { id: pool.id.toLowerCase(), token0: {
                        id: pool.token0.id.toLowerCase(),
                    }, token1: {
                        id: pool.token1.id.toLowerCase(),
                    }, tvlETH: parseFloat(totalValueLockedETH), tvlUSD: parseFloat(totalValueLockedUSD) });
            });
            util_1.log.info(`Got ${pools.length} V3 pools from the subgraph. ${poolsSanitized.length} after filtering`);
            return poolsSanitized;
        });
    }
}
exports.V3SubgraphProvider = V3SubgraphProvider;
