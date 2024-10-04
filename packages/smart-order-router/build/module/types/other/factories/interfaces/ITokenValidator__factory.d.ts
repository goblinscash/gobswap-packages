import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ITokenValidator, ITokenValidatorInterface } from "../../interfaces/ITokenValidator";
export declare class ITokenValidator__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address[]";
            readonly name: "tokens";
            readonly type: "address[]";
        }, {
            readonly internalType: "address[]";
            readonly name: "baseTokens";
            readonly type: "address[]";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountToBorrow";
            readonly type: "uint256";
        }];
        readonly name: "batchValidate";
        readonly outputs: readonly [{
            readonly internalType: "enum ITokenValidator.Status[]";
            readonly name: "";
            readonly type: "uint8[]";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly internalType: "address[]";
            readonly name: "baseTokens";
            readonly type: "address[]";
        }, {
            readonly internalType: "uint256";
            readonly name: "amountToBorrow";
            readonly type: "uint256";
        }];
        readonly name: "validate";
        readonly outputs: readonly [{
            readonly internalType: "enum ITokenValidator.Status";
            readonly name: "";
            readonly type: "uint8";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): ITokenValidatorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ITokenValidator;
}
