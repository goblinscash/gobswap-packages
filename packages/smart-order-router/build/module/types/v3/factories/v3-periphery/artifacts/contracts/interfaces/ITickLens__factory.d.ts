import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ITickLens, ITickLensInterface } from "../../../../../v3-periphery/artifacts/contracts/interfaces/ITickLens";
export declare class ITickLens__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "pool";
            readonly type: "address";
        }, {
            readonly internalType: "int16";
            readonly name: "tickBitmapIndex";
            readonly type: "int16";
        }];
        readonly name: "getPopulatedTicksInWord";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "int24";
                readonly name: "tick";
                readonly type: "int24";
            }, {
                readonly internalType: "int128";
                readonly name: "liquidityNet";
                readonly type: "int128";
            }, {
                readonly internalType: "uint128";
                readonly name: "liquidityGross";
                readonly type: "uint128";
            }];
            readonly internalType: "struct ITickLens.PopulatedTick[]";
            readonly name: "populatedTicks";
            readonly type: "tuple[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): ITickLensInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ITickLens;
}
