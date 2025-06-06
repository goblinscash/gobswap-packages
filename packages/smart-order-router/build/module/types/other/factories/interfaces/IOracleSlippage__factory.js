/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Contract, utils } from "ethers";
const _abi = [
    {
        inputs: [
            {
                internalType: "bytes[]",
                name: "paths",
                type: "bytes[]",
            },
            {
                internalType: "uint128[]",
                name: "amounts",
                type: "uint128[]",
            },
            {
                internalType: "uint24",
                name: "maximumTickDivergence",
                type: "uint24",
            },
            {
                internalType: "uint32",
                name: "secondsAgo",
                type: "uint32",
            },
        ],
        name: "checkOracleSlippage",
        outputs: [],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes",
                name: "path",
                type: "bytes",
            },
            {
                internalType: "uint24",
                name: "maximumTickDivergence",
                type: "uint24",
            },
            {
                internalType: "uint32",
                name: "secondsAgo",
                type: "uint32",
            },
        ],
        name: "checkOracleSlippage",
        outputs: [],
        stateMutability: "view",
        type: "function",
    },
];
export class IOracleSlippage__factory {
    static createInterface() {
        return new utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new Contract(address, _abi, signerOrProvider);
    }
}
IOracleSlippage__factory.abi = _abi;
