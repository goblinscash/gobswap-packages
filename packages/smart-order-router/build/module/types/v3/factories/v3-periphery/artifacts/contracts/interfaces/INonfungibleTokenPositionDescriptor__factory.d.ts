import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { INonfungibleTokenPositionDescriptor, INonfungibleTokenPositionDescriptorInterface } from "../../../../../v3-periphery/artifacts/contracts/interfaces/INonfungibleTokenPositionDescriptor";
export declare class INonfungibleTokenPositionDescriptor__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "contract INonfungiblePositionManager";
            readonly name: "positionManager";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "tokenURI";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): INonfungibleTokenPositionDescriptorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): INonfungibleTokenPositionDescriptor;
}
