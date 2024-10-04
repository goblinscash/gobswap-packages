import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IPeripheryPaymentsWithFee, IPeripheryPaymentsWithFeeInterface } from "../../../../../v3-periphery/artifacts/contracts/interfaces/IPeripheryPaymentsWithFee";
export declare class IPeripheryPaymentsWithFee__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "refundETH";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountMinimum";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "recipient";
            readonly type: "address";
        }];
        readonly name: "sweepToken";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountMinimum";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "feeBips";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "feeRecipient";
            readonly type: "address";
        }];
        readonly name: "sweepTokenWithFee";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountMinimum";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "recipient";
            readonly type: "address";
        }];
        readonly name: "unwrapWETH9";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "amountMinimum";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "feeBips";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "feeRecipient";
            readonly type: "address";
        }];
        readonly name: "unwrapWETH9WithFee";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }];
    static createInterface(): IPeripheryPaymentsWithFeeInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IPeripheryPaymentsWithFee;
}
