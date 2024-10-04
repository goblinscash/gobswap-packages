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
exports.V2HeuristicGasModelFactory = exports.COST_PER_EXTRA_HOP = exports.BASE_SWAP_COST = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("../../../../util");
const amounts_1 = require("../../../../util/amounts");
const gas_model_1 = require("../gas-model");
// Constant cost for doing any swap regardless of pools.
exports.BASE_SWAP_COST = bignumber_1.BigNumber.from(135000); // 115000, bumped up by 20_000 @eric 7/8/2022
// Constant per extra hop in the route.
exports.COST_PER_EXTRA_HOP = bignumber_1.BigNumber.from(50000); // 20000, bumped up by 30_000 @eric 7/8/2022
/**
 * Computes a gas estimate for a V2 swap using heuristics.
 * Considers number of hops in the route and the typical base cost for a swap.
 *
 * We compute gas estimates off-chain because
 *  1/ Calling eth_estimateGas for a swaps requires the caller to have
 *     the full balance token being swapped, and approvals.
 *  2/ Tracking gas used using a wrapper contract is not accurate with Multicall
 *     due to EIP-2929. We would have to make a request for every swap we wanted to estimate.
 *  3/ For V2 we simulate all our swaps off-chain so have no way to track gas used.
 *
 * Note, certain tokens e.g. rebasing/fee-on-transfer, may incur higher gas costs than
 * what we estimate here. This is because they run extra logic on token transfer.
 *
 * @export
 * @class V2HeuristicGasModelFactory
 */
class V2HeuristicGasModelFactory extends gas_model_1.IV2GasModelFactory {
    constructor() {
        super();
    }
    buildGasModel({ chainId, gasPriceWei, poolProvider, token, providerConfig, }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (token.equals(util_1.WRAPPED_NATIVE_CURRENCY[chainId])) {
                const usdPool = yield this.getHighestLiquidityUSDPool(chainId, poolProvider, providerConfig);
                return {
                    estimateGasCost: (routeWithValidQuote) => {
                        const { gasCostInEth, gasUse } = this.estimateGas(routeWithValidQuote, gasPriceWei, chainId, providerConfig);
                        const ethToken0 = usdPool.token0.address == util_1.WRAPPED_NATIVE_CURRENCY[chainId].address;
                        const ethTokenPrice = ethToken0
                            ? usdPool.token0Price
                            : usdPool.token1Price;
                        const gasCostInTermsOfUSD = ethTokenPrice.quote(gasCostInEth);
                        return {
                            gasEstimate: gasUse,
                            gasCostInToken: gasCostInEth,
                            gasCostInUSD: gasCostInTermsOfUSD,
                        };
                    },
                };
            }
            // If the quote token is not WETH, we convert the gas cost to be in terms of the quote token.
            // We do this by getting the highest liquidity <token>/ETH pool.
            const ethPoolPromise = this.getEthPool(chainId, token, poolProvider, providerConfig);
            const usdPoolPromise = this.getHighestLiquidityUSDPool(chainId, poolProvider, providerConfig);
            const [ethPool, usdPool] = yield Promise.all([
                ethPoolPromise,
                usdPoolPromise,
            ]);
            if (!ethPool) {
                util_1.log.info('Unable to find ETH pool with the quote token to produce gas adjusted costs. Route will not account for gas.');
            }
            return {
                estimateGasCost: (routeWithValidQuote) => {
                    const usdToken = usdPool.token0.address == util_1.WRAPPED_NATIVE_CURRENCY[chainId].address
                        ? usdPool.token1
                        : usdPool.token0;
                    const { gasCostInEth, gasUse } = this.estimateGas(routeWithValidQuote, gasPriceWei, chainId, Object.assign({}, providerConfig));
                    if (!ethPool) {
                        return {
                            gasEstimate: gasUse,
                            gasCostInToken: amounts_1.CurrencyAmount.fromRawAmount(token, 0),
                            gasCostInUSD: amounts_1.CurrencyAmount.fromRawAmount(usdToken, 0),
                        };
                    }
                    const ethToken0 = ethPool.token0.address == util_1.WRAPPED_NATIVE_CURRENCY[chainId].address;
                    const ethTokenPrice = ethToken0
                        ? ethPool.token0Price
                        : ethPool.token1Price;
                    let gasCostInTermsOfQuoteToken;
                    try {
                        gasCostInTermsOfQuoteToken = ethTokenPrice.quote(gasCostInEth);
                    }
                    catch (err) {
                        util_1.log.error({
                            ethTokenPriceBase: ethTokenPrice.baseCurrency,
                            ethTokenPriceQuote: ethTokenPrice.quoteCurrency,
                            gasCostInEth: gasCostInEth.currency,
                        }, 'Debug eth price token issue');
                        throw err;
                    }
                    const ethToken0USDPool = usdPool.token0.address == util_1.WRAPPED_NATIVE_CURRENCY[chainId].address;
                    const ethTokenPriceUSDPool = ethToken0USDPool
                        ? usdPool.token0Price
                        : usdPool.token1Price;
                    let gasCostInTermsOfUSD;
                    try {
                        gasCostInTermsOfUSD = ethTokenPriceUSDPool.quote(gasCostInEth);
                    }
                    catch (err) {
                        util_1.log.error({
                            usdT1: usdPool.token0.symbol,
                            usdT2: usdPool.token1.symbol,
                            gasCostInEthToken: gasCostInEth.currency.symbol,
                        }, 'Failed to compute USD gas price');
                        throw err;
                    }
                    return {
                        gasEstimate: gasUse,
                        gasCostInToken: gasCostInTermsOfQuoteToken,
                        gasCostInUSD: gasCostInTermsOfUSD,
                    };
                },
            };
        });
    }
    estimateGas(routeWithValidQuote, gasPriceWei, chainId, providerConfig) {
        const hops = routeWithValidQuote.route.pairs.length;
        let gasUse = exports.BASE_SWAP_COST.add(exports.COST_PER_EXTRA_HOP.mul(hops - 1));
        if (providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.additionalGasOverhead) {
            gasUse = gasUse.add(providerConfig.additionalGasOverhead);
        }
        const totalGasCostWei = gasPriceWei.mul(gasUse);
        const weth = util_1.WRAPPED_NATIVE_CURRENCY[chainId];
        const gasCostInEth = amounts_1.CurrencyAmount.fromRawAmount(weth, totalGasCostWei.toString());
        return { gasCostInEth, gasUse };
    }
    getEthPool(chainId, token, poolProvider, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const weth = util_1.WRAPPED_NATIVE_CURRENCY[chainId];
            const poolAccessor = yield poolProvider.getPools([[weth, token]], providerConfig);
            const pool = poolAccessor.getPool(weth, token);
            if (!pool || pool.reserve0.equalTo(0) || pool.reserve1.equalTo(0)) {
                util_1.log.error({
                    weth,
                    token,
                    reserve0: pool === null || pool === void 0 ? void 0 : pool.reserve0.toExact(),
                    reserve1: pool === null || pool === void 0 ? void 0 : pool.reserve1.toExact(),
                }, `Could not find a valid WETH pool with ${token.symbol} for computing gas costs.`);
                return null;
            }
            return pool;
        });
    }
    getHighestLiquidityUSDPool(chainId, poolProvider, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const usdTokens = gas_model_1.usdGasTokensByChain[chainId];
            if (!usdTokens) {
                throw new Error(`Could not find a USD token for computing gas costs on ${chainId}`);
            }
            const usdPools = lodash_1.default.map(usdTokens, (usdToken) => [
                usdToken,
                util_1.WRAPPED_NATIVE_CURRENCY[chainId],
            ]);
            const poolAccessor = yield poolProvider.getPools(usdPools, providerConfig);
            const poolsRaw = poolAccessor.getAllPools();
            const pools = lodash_1.default.filter(poolsRaw, (pool) => pool.reserve0.greaterThan(0) && pool.reserve1.greaterThan(0));
            if (pools.length == 0) {
                util_1.log.error({ pools }, `Could not find a USD/WETH pool for computing gas costs.`);
                throw new Error(`Can't find USD/WETH pool for computing gas costs.`);
            }
            const maxPool = lodash_1.default.maxBy(pools, (pool) => {
                if (pool.token0.equals(util_1.WRAPPED_NATIVE_CURRENCY[chainId])) {
                    return parseFloat(pool.reserve0.toSignificant(2));
                }
                else {
                    return parseFloat(pool.reserve1.toSignificant(2));
                }
            });
            return maxPool;
        });
    }
}
exports.V2HeuristicGasModelFactory = V2HeuristicGasModelFactory;
