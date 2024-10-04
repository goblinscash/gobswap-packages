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
exports.ArbitrumGasDataProvider = exports.OptimismGasDataProvider = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const GasDataArbitrum__factory_1 = require("../../types/other/factories/GasDataArbitrum__factory");
const GasPriceOracle__factory_1 = require("../../types/other/factories/GasPriceOracle__factory");
const util_1 = require("../../util");
class OptimismGasDataProvider {
    constructor(chainId, multicall2Provider, gasPriceAddress) {
        this.chainId = chainId;
        this.multicall2Provider = multicall2Provider;
        if (chainId !== sdk_core_1.ChainId.OPTIMISM && chainId !== sdk_core_1.ChainId.BASE) {
            throw new Error('This data provider is used only on optimism networks.');
        }
        this.gasOracleAddress = gasPriceAddress !== null && gasPriceAddress !== void 0 ? gasPriceAddress : util_1.OVM_GASPRICE_ADDRESS;
    }
    /**
     * Gets the data constants needed to calculate the l1 security fee on Optimism.
     * @returns An OptimismGasData object that includes the l1BaseFee,
     * scalar, decimals, and overhead values.
     */
    getGasData() {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const funcNames = ['l1BaseFee', 'scalar', 'decimals', 'overhead'];
            const tx = yield this.multicall2Provider.callMultipleFunctionsOnSameContract({
                address: this.gasOracleAddress,
                contractInterface: GasPriceOracle__factory_1.GasPriceOracle__factory.createInterface(),
                functionNames: funcNames,
            });
            if (!((_a = tx.results[0]) === null || _a === void 0 ? void 0 : _a.success) ||
                !((_b = tx.results[1]) === null || _b === void 0 ? void 0 : _b.success) ||
                !((_c = tx.results[2]) === null || _c === void 0 ? void 0 : _c.success) ||
                !((_d = tx.results[3]) === null || _d === void 0 ? void 0 : _d.success)) {
                util_1.log.info({ results: tx.results }, 'Failed to get gas constants data from the optimism gas oracle');
                throw new Error('Failed to get gas constants data from the optimism gas oracle');
            }
            const { result: l1BaseFee } = tx.results[0];
            const { result: scalar } = tx.results[1];
            const { result: decimals } = tx.results[2];
            const { result: overhead } = tx.results[3];
            return {
                l1BaseFee: l1BaseFee[0],
                scalar: scalar[0],
                decimals: decimals[0],
                overhead: overhead[0],
            };
        });
    }
}
exports.OptimismGasDataProvider = OptimismGasDataProvider;
class ArbitrumGasDataProvider {
    constructor(chainId, provider, gasDataAddress) {
        this.chainId = chainId;
        this.provider = provider;
        this.gasFeesAddress = gasDataAddress ? gasDataAddress : util_1.ARB_GASINFO_ADDRESS;
    }
    getGasData() {
        return __awaiter(this, void 0, void 0, function* () {
            const gasDataContract = GasDataArbitrum__factory_1.GasDataArbitrum__factory.connect(this.gasFeesAddress, this.provider);
            const gasData = yield gasDataContract.getPricesInWei();
            return {
                perL2TxFee: gasData[0],
                perL1CalldataFee: gasData[1],
                perArbGasTotal: gasData[5],
            };
        });
    }
}
exports.ArbitrumGasDataProvider = ArbitrumGasDataProvider;
