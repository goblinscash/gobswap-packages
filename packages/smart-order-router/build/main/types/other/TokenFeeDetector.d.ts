import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export type TokenFeesStruct = {
    buyFeeBps: BigNumberish;
    sellFeeBps: BigNumberish;
};
export type TokenFeesStructOutput = [BigNumber, BigNumber] & {
    buyFeeBps: BigNumber;
    sellFeeBps: BigNumber;
};
export interface TokenFeeDetectorInterface extends utils.Interface {
    functions: {
        "batchValidate(address[],address,uint256)": FunctionFragment;
        "uniswapV2Call(address,uint256,uint256,bytes)": FunctionFragment;
        "validate(address,address,uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "batchValidate" | "uniswapV2Call" | "validate"): FunctionFragment;
    encodeFunctionData(functionFragment: "batchValidate", values: [string[], string, BigNumberish]): string;
    encodeFunctionData(functionFragment: "uniswapV2Call", values: [string, BigNumberish, BigNumberish, BytesLike]): string;
    encodeFunctionData(functionFragment: "validate", values: [string, string, BigNumberish]): string;
    decodeFunctionResult(functionFragment: "batchValidate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "uniswapV2Call", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "validate", data: BytesLike): Result;
    events: {};
}
export interface TokenFeeDetector extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TokenFeeDetectorInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        batchValidate(tokens: string[], baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
            from?: string;
        }): Promise<ContractTransaction>;
        uniswapV2Call(arg0: string, amount0: BigNumberish, arg2: BigNumberish, data: BytesLike, overrides?: Overrides & {
            from?: string;
        }): Promise<ContractTransaction>;
        validate(token: string, baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
            from?: string;
        }): Promise<ContractTransaction>;
    };
    batchValidate(tokens: string[], baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
        from?: string;
    }): Promise<ContractTransaction>;
    uniswapV2Call(arg0: string, amount0: BigNumberish, arg2: BigNumberish, data: BytesLike, overrides?: Overrides & {
        from?: string;
    }): Promise<ContractTransaction>;
    validate(token: string, baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
        from?: string;
    }): Promise<ContractTransaction>;
    callStatic: {
        batchValidate(tokens: string[], baseToken: string, amountToBorrow: BigNumberish, overrides?: CallOverrides): Promise<TokenFeesStructOutput[]>;
        uniswapV2Call(arg0: string, amount0: BigNumberish, arg2: BigNumberish, data: BytesLike, overrides?: CallOverrides): Promise<void>;
        validate(token: string, baseToken: string, amountToBorrow: BigNumberish, overrides?: CallOverrides): Promise<TokenFeesStructOutput>;
    };
    filters: {};
    estimateGas: {
        batchValidate(tokens: string[], baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
            from?: string;
        }): Promise<BigNumber>;
        uniswapV2Call(arg0: string, amount0: BigNumberish, arg2: BigNumberish, data: BytesLike, overrides?: Overrides & {
            from?: string;
        }): Promise<BigNumber>;
        validate(token: string, baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
            from?: string;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        batchValidate(tokens: string[], baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
            from?: string;
        }): Promise<PopulatedTransaction>;
        uniswapV2Call(arg0: string, amount0: BigNumberish, arg2: BigNumberish, data: BytesLike, overrides?: Overrides & {
            from?: string;
        }): Promise<PopulatedTransaction>;
        validate(token: string, baseToken: string, amountToBorrow: BigNumberish, overrides?: Overrides & {
            from?: string;
        }): Promise<PopulatedTransaction>;
    };
}
