import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IMulticall, IMulticallInterface } from "../../../../../v3-periphery/artifacts/contracts/interfaces/IMulticall";
export declare class IMulticall__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "bytes[]";
            readonly name: "data";
            readonly type: "bytes[]";
        }];
        readonly name: "multicall";
        readonly outputs: readonly [{
            readonly internalType: "bytes[]";
            readonly name: "results";
            readonly type: "bytes[]";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }];
    static createInterface(): IMulticallInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IMulticall;
}
