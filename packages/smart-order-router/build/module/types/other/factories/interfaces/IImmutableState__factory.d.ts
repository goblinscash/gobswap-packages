import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IImmutableState, IImmutableStateInterface } from "../../interfaces/IImmutableState";
export declare class IImmutableState__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "factoryV2";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "positionManager";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): IImmutableStateInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IImmutableState;
}
