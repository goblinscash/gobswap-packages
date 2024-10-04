import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IUniswapV3FlashCallback, IUniswapV3FlashCallbackInterface } from "../../../../../../v3-core/artifacts/contracts/interfaces/callback/IUniswapV3FlashCallback";
export declare class IUniswapV3FlashCallback__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "fee0";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "fee1";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "uniswapV3FlashCallback";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): IUniswapV3FlashCallbackInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3FlashCallback;
}
