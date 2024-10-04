import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface GasDataArbitrumInterface extends utils.Interface {
    functions: {
        "getPricesInWei()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "getPricesInWei"): FunctionFragment;
    encodeFunctionData(functionFragment: "getPricesInWei", values?: undefined): string;
    decodeFunctionResult(functionFragment: "getPricesInWei", data: BytesLike): Result;
    events: {};
}
export interface GasDataArbitrum extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: GasDataArbitrumInterface;
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
        getPricesInWei(overrides?: CallOverrides): Promise<[
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber
        ]>;
    };
    getPricesInWei(overrides?: CallOverrides): Promise<[
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber
    ]>;
    callStatic: {
        getPricesInWei(overrides?: CallOverrides): Promise<[
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber
        ]>;
    };
    filters: {};
    estimateGas: {
        getPricesInWei(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        getPricesInWei(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
