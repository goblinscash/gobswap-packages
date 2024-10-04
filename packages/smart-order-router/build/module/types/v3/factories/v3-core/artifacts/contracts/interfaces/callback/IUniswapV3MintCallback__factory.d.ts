import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IUniswapV3MintCallback, IUniswapV3MintCallbackInterface } from "../../../../../../v3-core/artifacts/contracts/interfaces/callback/IUniswapV3MintCallback";
export declare class IUniswapV3MintCallback__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amount0Owed";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount1Owed";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "uniswapV3MintCallback";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): IUniswapV3MintCallbackInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3MintCallback;
}
