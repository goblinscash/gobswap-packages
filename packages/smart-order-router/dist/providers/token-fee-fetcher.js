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
exports.OnChainTokenFeeFetcher = exports.DEFAULT_TOKEN_FEE_RESULT = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const sdk_core_1 = require("@uniswap/sdk-core");
const TokenFeeDetector__factory_1 = require("../types/other/factories/TokenFeeDetector__factory");
const util_1 = require("../util");
const DEFAULT_TOKEN_BUY_FEE_BPS = bignumber_1.BigNumber.from(0);
const DEFAULT_TOKEN_SELL_FEE_BPS = bignumber_1.BigNumber.from(0);
// on detector failure, assume no fee
exports.DEFAULT_TOKEN_FEE_RESULT = {
    buyFeeBps: DEFAULT_TOKEN_BUY_FEE_BPS,
    sellFeeBps: DEFAULT_TOKEN_SELL_FEE_BPS,
};
// address at which the FeeDetector lens is deployed
const FEE_DETECTOR_ADDRESS = (chainId) => {
    switch (chainId) {
        case sdk_core_1.ChainId.MAINNET:
        default:
            return '0x19C97dc2a25845C7f9d1d519c8C2d4809c58b43f';
    }
};
// Amount has to be big enough to avoid rounding errors, but small enough that
// most v2 pools will have at least this many token units
// 100000 is the smallest number that avoids rounding errors in bps terms
// 10000 was not sufficient due to rounding errors for rebase token (e.g. stETH)
const AMOUNT_TO_FLASH_BORROW = '100000';
// 1M gas limit per validate call, should cover most swap cases
const GAS_LIMIT_PER_VALIDATE = 1000000;
class OnChainTokenFeeFetcher {
    constructor(chainId, rpcProvider, tokenFeeAddress = FEE_DETECTOR_ADDRESS(chainId), gasLimitPerCall = GAS_LIMIT_PER_VALIDATE, amountToFlashBorrow = AMOUNT_TO_FLASH_BORROW) {
        var _a;
        this.chainId = chainId;
        this.tokenFeeAddress = tokenFeeAddress;
        this.gasLimitPerCall = gasLimitPerCall;
        this.amountToFlashBorrow = amountToFlashBorrow;
        this.BASE_TOKEN = (_a = util_1.WRAPPED_NATIVE_CURRENCY[this.chainId]) === null || _a === void 0 ? void 0 : _a.address;
        this.contract = TokenFeeDetector__factory_1.TokenFeeDetector__factory.connect(this.tokenFeeAddress, rpcProvider);
    }
    fetchFees(addresses, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenToResult = {};
            const addressesWithoutBaseToken = addresses.filter((address) => address.toLowerCase() !== this.BASE_TOKEN.toLowerCase());
            const functionParams = addressesWithoutBaseToken.map((address) => [
                address,
                this.BASE_TOKEN,
                this.amountToFlashBorrow,
            ]);
            const results = yield Promise.all(functionParams.map(([address, baseToken, amountToBorrow]) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // We use the validate function instead of batchValidate to avoid poison pill problem.
                    // One token that consumes too much gas could cause the entire batch to fail.
                    const feeResult = yield this.contract.callStatic.validate(address, baseToken, amountToBorrow, {
                        gasLimit: this.gasLimitPerCall,
                        blockTag: providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber,
                    });
                    util_1.metric.putMetric('TokenFeeFetcherFetchFeesSuccess', 1, util_1.MetricLoggerUnit.Count);
                    return Object.assign({ address }, feeResult);
                }
                catch (err) {
                    util_1.log.error({ err }, `Error calling validate on-chain for token ${address}`);
                    util_1.metric.putMetric('TokenFeeFetcherFetchFeesFailure', 1, util_1.MetricLoggerUnit.Count);
                    // in case of FOT token fee fetch failure, we return null
                    // so that they won't get returned from the token-fee-fetcher
                    // and thus no fee will be applied, and the cache won't cache on FOT tokens with failed fee fetching
                    return { address, buyFeeBps: undefined, sellFeeBps: undefined };
                }
            })));
            results.forEach(({ address, buyFeeBps, sellFeeBps }) => {
                if (buyFeeBps || sellFeeBps) {
                    tokenToResult[address] = { buyFeeBps, sellFeeBps };
                }
            });
            return tokenToResult;
        });
    }
}
exports.OnChainTokenFeeFetcher = OnChainTokenFeeFetcher;
