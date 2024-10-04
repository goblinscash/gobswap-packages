import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IV2SwapRouter, IV2SwapRouterInterface } from "../../interfaces/IV2SwapRouter";
export declare class IV2SwapRouter__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountIn";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountOutMin";
            readonly type: "uint256";
        }, {
            readonly internalType: "address[]";
            readonly name: "path";
            readonly type: "address[]";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }];
        readonly name: "swapExactTokensForTokens";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountOut";
            readonly type: "uint256";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountOut";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountInMax";
            readonly type: "uint256";
        }, {
            readonly internalType: "address[]";
            readonly name: "path";
            readonly type: "address[]";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }];
        readonly name: "swapTokensForExactTokens";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountIn";
            readonly type: "uint256";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }];
    static createInterface(): IV2SwapRouterInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IV2SwapRouter;
}
