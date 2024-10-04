import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IMixedRouteQuoterV1, IMixedRouteQuoterV1Interface } from "../../interfaces/IMixedRouteQuoterV1";
export declare class IMixedRouteQuoterV1__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "path";
            readonly type: "bytes";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountIn";
            readonly type: "uint256";
        }];
        readonly name: "quoteExactInput";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountOut";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint160[]";
            readonly name: "v3SqrtPriceX96AfterList";
            readonly type: "uint160[]";
        }, {
            readonly internalType: "uint32[]";
            readonly name: "v3InitializedTicksCrossedList";
            readonly type: "uint32[]";
        }, {
            readonly internalType: "uint256";
            readonly name: "v3SwapGasEstimate";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "address";
                readonly name: "tokenIn";
                readonly type: "address";
            }, {
                readonly internalType: "address";
                readonly name: "tokenOut";
                readonly type: "address";
            }, {
                readonly internalType: "uint256";
                readonly name: "amountIn";
                readonly type: "uint256";
            }];
            readonly internalType: "struct IMixedRouteQuoterV1.QuoteExactInputSingleV2Params";
            readonly name: "params";
            readonly type: "tuple";
        }];
        readonly name: "quoteExactInputSingleV2";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountOut";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "address";
                readonly name: "tokenIn";
                readonly type: "address";
            }, {
                readonly internalType: "address";
                readonly name: "tokenOut";
                readonly type: "address";
            }, {
                readonly internalType: "uint256";
                readonly name: "amountIn";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint24";
                readonly name: "fee";
                readonly type: "uint24";
            }, {
                readonly internalType: "uint160";
                readonly name: "sqrtPriceLimitX96";
                readonly type: "uint160";
            }];
            readonly internalType: "struct IMixedRouteQuoterV1.QuoteExactInputSingleV3Params";
            readonly name: "params";
            readonly type: "tuple";
        }];
        readonly name: "quoteExactInputSingleV3";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountOut";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint160";
            readonly name: "sqrtPriceX96After";
            readonly type: "uint160";
        }, {
            readonly internalType: "uint32";
            readonly name: "initializedTicksCrossed";
            readonly type: "uint32";
        }, {
            readonly internalType: "uint256";
            readonly name: "gasEstimate";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): IMixedRouteQuoterV1Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): IMixedRouteQuoterV1;
}
