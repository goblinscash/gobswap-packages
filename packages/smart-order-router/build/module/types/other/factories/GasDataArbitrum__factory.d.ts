import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { GasDataArbitrum, GasDataArbitrumInterface } from "../GasDataArbitrum";
export declare class GasDataArbitrum__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "getPricesInWei";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): GasDataArbitrumInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): GasDataArbitrum;
}
