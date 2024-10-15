import { SwapRouter02__factory } from '../types/other/factories/SwapRouter02__factory';
import { log, SWAP_ROUTER_02_ADDRESSES } from '../util';
export class SwapRouterProvider {
    constructor(multicall2Provider, chainId) {
        this.multicall2Provider = multicall2Provider;
        this.chainId = chainId;
    }
    async getApprovalType(tokenInAmount, tokenOutAmount) {
        var _a, _b;
        const functionParams = [
            [
                tokenInAmount.currency.wrapped.address,
                tokenInAmount.quotient.toString(),
            ],
            [
                tokenOutAmount.currency.wrapped.address,
                tokenOutAmount.quotient.toString(),
            ],
        ];
        const tx = await this.multicall2Provider.callSameFunctionOnContractWithMultipleParams({
            address: SWAP_ROUTER_02_ADDRESSES(this.chainId),
            contractInterface: SwapRouter02__factory.createInterface(),
            functionName: 'getApprovalType',
            functionParams,
        });
        if (!((_a = tx.results[0]) === null || _a === void 0 ? void 0 : _a.success) || !((_b = tx.results[1]) === null || _b === void 0 ? void 0 : _b.success)) {
            log.info({ results: tx.results }, 'Failed to get approval type from swap router for token in or token out');
            throw new Error('Failed to get approval type from swap router for token in or token out');
        }
        const { result: approvalTokenIn } = tx.results[0];
        const { result: approvalTokenOut } = tx.results[1];
        return {
            approvalTokenIn: approvalTokenIn[0],
            approvalTokenOut: approvalTokenOut[0],
        };
    }
}
