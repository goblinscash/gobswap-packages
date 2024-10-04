import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IUniswapV3PoolDeployer, IUniswapV3PoolDeployerInterface } from "../../../../../v3-core/artifacts/contracts/interfaces/IUniswapV3PoolDeployer";
export declare class IUniswapV3PoolDeployer__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "parameters";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "factory";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "token0";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "token1";
            readonly type: "address";
        }, {
            readonly internalType: "uint24";
            readonly name: "fee";
            readonly type: "uint24";
        }, {
            readonly internalType: "int24";
            readonly name: "tickSpacing";
            readonly type: "int24";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): IUniswapV3PoolDeployerInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV3PoolDeployer;
}
