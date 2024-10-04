import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IOracleSlippage, IOracleSlippageInterface } from "../../interfaces/IOracleSlippage";
export declare class IOracleSlippage__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "bytes[]";
            readonly name: "paths";
            readonly type: "bytes[]";
        }, {
            readonly internalType: "uint128[]";
            readonly name: "amounts";
            readonly type: "uint128[]";
        }, {
            readonly internalType: "uint24";
            readonly name: "maximumTickDivergence";
            readonly type: "uint24";
        }, {
            readonly internalType: "uint32";
            readonly name: "secondsAgo";
            readonly type: "uint32";
        }];
        readonly name: "checkOracleSlippage";
        readonly outputs: readonly [];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "path";
            readonly type: "bytes";
        }, {
            readonly internalType: "uint24";
            readonly name: "maximumTickDivergence";
            readonly type: "uint24";
        }, {
            readonly internalType: "uint32";
            readonly name: "secondsAgo";
            readonly type: "uint32";
        }];
        readonly name: "checkOracleSlippage";
        readonly outputs: readonly [];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): IOracleSlippageInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IOracleSlippage;
}
