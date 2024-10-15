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
exports.SwapRouterProvider = void 0;
const SwapRouter02__factory_1 = require("../types/other/factories/SwapRouter02__factory");
const util_1 = require("../util");
class SwapRouterProvider {
    constructor(multicall2Provider, chainId) {
        this.multicall2Provider = multicall2Provider;
        this.chainId = chainId;
    }
    getApprovalType(tokenInAmount, tokenOutAmount) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
            const tx = yield this.multicall2Provider.callSameFunctionOnContractWithMultipleParams({
                address: (0, util_1.SWAP_ROUTER_02_ADDRESSES)(this.chainId),
                contractInterface: SwapRouter02__factory_1.SwapRouter02__factory.createInterface(),
                functionName: 'getApprovalType',
                functionParams,
            });
            if (!((_a = tx.results[0]) === null || _a === void 0 ? void 0 : _a.success) || !((_b = tx.results[1]) === null || _b === void 0 ? void 0 : _b.success)) {
                util_1.log.info({ results: tx.results }, 'Failed to get approval type from swap router for token in or token out');
                throw new Error('Failed to get approval type from swap router for token in or token out');
            }
            const { result: approvalTokenIn } = tx.results[0];
            const { result: approvalTokenOut } = tx.results[1];
            return {
                approvalTokenIn: approvalTokenIn[0],
                approvalTokenOut: approvalTokenOut[0],
            };
        });
    }
}
exports.SwapRouterProvider = SwapRouterProvider;
