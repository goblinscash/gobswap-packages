import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IUniswapV2Migrator, IUniswapV2MigratorInterface } from "../../../v2-periphery/build/IUniswapV2Migrator";
export declare class IUniswapV2Migrator__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountTokenMin";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountETHMin";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "deadline";
            readonly type: "uint256";
        }];
        readonly name: "migrate";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): IUniswapV2MigratorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV2Migrator;
}
