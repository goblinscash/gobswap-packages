import { ChainId } from '@uniswap/sdk-core';
import { GasDataArbitrum__factory } from '../../types/other/factories/GasDataArbitrum__factory';
import { GasPriceOracle__factory } from '../../types/other/factories/GasPriceOracle__factory';
import { ARB_GASINFO_ADDRESS, log, OVM_GASPRICE_ADDRESS, } from '../../util';
export class OptimismGasDataProvider {
    constructor(chainId, multicall2Provider, gasPriceAddress) {
        this.chainId = chainId;
        this.multicall2Provider = multicall2Provider;
        if (chainId !== ChainId.OPTIMISM && chainId !== ChainId.BASE) {
            throw new Error('This data provider is used only on optimism networks.');
        }
        this.gasOracleAddress = gasPriceAddress !== null && gasPriceAddress !== void 0 ? gasPriceAddress : OVM_GASPRICE_ADDRESS;
    }
    /**
     * Gets the data constants needed to calculate the l1 security fee on Optimism.
     * @returns An OptimismGasData object that includes the l1BaseFee,
     * scalar, decimals, and overhead values.
     */
    async getGasData() {
        var _a, _b, _c, _d;
        const funcNames = ['l1BaseFee', 'scalar', 'decimals', 'overhead'];
        const tx = await this.multicall2Provider.callMultipleFunctionsOnSameContract({
            address: this.gasOracleAddress,
            contractInterface: GasPriceOracle__factory.createInterface(),
            functionNames: funcNames,
        });
        if (!((_a = tx.results[0]) === null || _a === void 0 ? void 0 : _a.success) ||
            !((_b = tx.results[1]) === null || _b === void 0 ? void 0 : _b.success) ||
            !((_c = tx.results[2]) === null || _c === void 0 ? void 0 : _c.success) ||
            !((_d = tx.results[3]) === null || _d === void 0 ? void 0 : _d.success)) {
            log.info({ results: tx.results }, 'Failed to get gas constants data from the optimism gas oracle');
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
    }
}
export class ArbitrumGasDataProvider {
    constructor(chainId, provider, gasDataAddress) {
        this.chainId = chainId;
        this.provider = provider;
        this.gasFeesAddress = gasDataAddress ? gasDataAddress : ARB_GASINFO_ADDRESS;
    }
    async getGasData() {
        const gasDataContract = GasDataArbitrum__factory.connect(this.gasFeesAddress, this.provider);
        const gasData = await gasDataContract.getPricesInWei();
        return {
            perL2TxFee: gasData[0],
            perL1CalldataFee: gasData[1],
            perArbGasTotal: gasData[5],
        };
    }
}
