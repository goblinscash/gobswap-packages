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
exports.EIP1559GasPriceProvider = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const lodash_1 = __importDefault(require("lodash"));
const log_1 = require("../util/log");
const gas_price_provider_1 = require("./gas-price-provider");
// We get the Xth percentile of priority fees for transactions successfully included in previous blocks.
const DEFAULT_PRIORITY_FEE_PERCENTILE = 50;
// Infura docs say only past 4 blocks guaranteed to be available: https://infura.io/docs/ethereum#operation/eth_feeHistory
const DEFAULT_BLOCKS_TO_LOOK_BACK = 4;
/**
 * Computes a gas estimate using on-chain data from the eth_feeHistory RPC endpoint.
 *
 * Takes the average priority fee from the past `blocksToConsider` blocks, and adds it
 * to the current base fee.
 *
 * @export
 * @class EIP1559GasPriceProvider
 */
class EIP1559GasPriceProvider extends gas_price_provider_1.IGasPriceProvider {
    constructor(provider, priorityFeePercentile = DEFAULT_PRIORITY_FEE_PERCENTILE, blocksToConsider = DEFAULT_BLOCKS_TO_LOOK_BACK) {
        super();
        this.provider = provider;
        this.priorityFeePercentile = priorityFeePercentile;
        this.blocksToConsider = blocksToConsider;
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            const feeHistoryRaw = (yield this.provider.send('eth_feeHistory', [
                /**
                 * @fix Use BigNumber.from(this.blocksToConsider).toHexString() after hardhat adds support
                 * @see https://github.com/NomicFoundation/hardhat/issues/1585 .___.
                 */
                bignumber_1.BigNumber.from(this.blocksToConsider).toHexString().replace('0x0', '0x'),
                'latest',
                [this.priorityFeePercentile],
            ]));
            const feeHistory = {
                baseFeePerGas: lodash_1.default.map(feeHistoryRaw.baseFeePerGas, (b) => bignumber_1.BigNumber.from(b)),
                gasUsedRatio: feeHistoryRaw.gasUsedRatio,
                oldestBlock: bignumber_1.BigNumber.from(feeHistoryRaw.oldestBlock),
                reward: lodash_1.default.map(feeHistoryRaw.reward, (b) => bignumber_1.BigNumber.from(b[0])),
            };
            const nextBlockBaseFeePerGas = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
            const averagePriorityFeePerGas = lodash_1.default.reduce(feeHistory.reward, (sum, cur) => sum.add(cur), bignumber_1.BigNumber.from(0)).div(feeHistory.reward.length);
            log_1.log.info({
                feeHistory,
                feeHistoryReadable: {
                    baseFeePerGas: lodash_1.default.map(feeHistory.baseFeePerGas, (f) => f.toString()),
                    oldestBlock: feeHistory.oldestBlock.toString(),
                    reward: lodash_1.default.map(feeHistory.reward, (r) => r.toString()),
                },
                nextBlockBaseFeePerGas: nextBlockBaseFeePerGas.toString(),
                averagePriorityFeePerGas: averagePriorityFeePerGas.toString(),
            }, 'Got fee history from provider and computed gas estimate');
            const gasPriceWei = nextBlockBaseFeePerGas.add(averagePriorityFeePerGas);
            const blockNumber = feeHistory.oldestBlock.add(this.blocksToConsider);
            log_1.log.info(`Estimated gas price in wei: ${gasPriceWei} as of block ${blockNumber.toString()}`);
            return { gasPriceWei: gasPriceWei };
        });
    }
}
exports.EIP1559GasPriceProvider = EIP1559GasPriceProvider;
