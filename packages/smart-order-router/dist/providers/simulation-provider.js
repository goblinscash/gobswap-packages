"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simulator = exports.SimulationStatus = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const universal_router_sdk_1 = require("@uniswap/universal-router-sdk");
const ethers_1 = require("ethers/lib/ethers");
const routers_1 = require("../routers");
const Erc20__factory_1 = require("../types/other/factories/Erc20__factory");
const Permit2__factory_1 = require("../types/other/factories/Permit2__factory");
const util_1 = require("../util");
var SimulationStatus;
(function (SimulationStatus) {
    SimulationStatus[SimulationStatus["NotSupported"] = 0] = "NotSupported";
    SimulationStatus[SimulationStatus["Failed"] = 1] = "Failed";
    SimulationStatus[SimulationStatus["Succeeded"] = 2] = "Succeeded";
    SimulationStatus[SimulationStatus["InsufficientBalance"] = 3] = "InsufficientBalance";
    SimulationStatus[SimulationStatus["NotApproved"] = 4] = "NotApproved";
})(SimulationStatus = exports.SimulationStatus || (exports.SimulationStatus = {}));
/**
 * Provider for dry running transactions.
 *
 * @export
 * @class Simulator
 */
class Simulator {
    /**
     * Returns a new SwapRoute with simulated gas estimates
     * @returns SwapRoute
     */
    constructor(provider, portionProvider, chainId) {
        this.chainId = chainId;
        this.provider = provider;
        this.portionProvider = portionProvider;
    }
    simulate(fromAddress, swapOptions, swapRoute, amount, quote, l2GasData, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.userHasSufficientBalance(fromAddress, swapRoute.trade.tradeType, amount, quote)) {
                util_1.log.info('User has sufficient balance to simulate. Simulating transaction.');
                try {
                    return this.simulateTransaction(fromAddress, swapOptions, swapRoute, l2GasData, providerConfig);
                }
                catch (e) {
                    util_1.log.error({ e }, 'Error simulating transaction');
                    return Object.assign(Object.assign({}, swapRoute), { simulationStatus: SimulationStatus.Failed });
                }
            }
            else {
                util_1.log.error('User does not have sufficient balance to simulate.');
                return Object.assign(Object.assign({}, swapRoute), { simulationStatus: SimulationStatus.InsufficientBalance });
            }
        });
    }
    userHasSufficientBalance(fromAddress, tradeType, amount, quote) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const neededBalance = tradeType == sdk_core_1.TradeType.EXACT_INPUT ? amount : quote;
                let balance;
                if (neededBalance.currency.isNative) {
                    balance = yield this.provider.getBalance(fromAddress);
                }
                else {
                    const tokenContract = Erc20__factory_1.Erc20__factory.connect(neededBalance.currency.address, this.provider);
                    balance = yield tokenContract.balanceOf(fromAddress);
                }
                const hasBalance = balance.gte(ethers_1.BigNumber.from(neededBalance.quotient.toString()));
                util_1.log.info({
                    fromAddress,
                    balance: balance.toString(),
                    neededBalance: neededBalance.quotient.toString(),
                    neededAddress: neededBalance.wrapped.currency.address,
                    hasBalance,
                }, 'Result of balance check for simulation');
                return hasBalance;
            }
            catch (e) {
                util_1.log.error(e, 'Error while checking user balance');
                return false;
            }
        });
    }
    checkTokenApproved(fromAddress, inputAmount, swapOptions, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check token has approved Permit2 more than expected amount.
            const tokenContract = Erc20__factory_1.Erc20__factory.connect(inputAmount.currency.wrapped.address, provider);
            if (swapOptions.type == routers_1.SwapType.UNIVERSAL_ROUTER) {
                const permit2Allowance = yield tokenContract.allowance(fromAddress, universal_router_sdk_1.PERMIT2_ADDRESS);
                // If a permit has been provided we don't need to check if UR has already been allowed.
                if (swapOptions.inputTokenPermit) {
                    util_1.log.info({
                        permitAllowance: permit2Allowance.toString(),
                        inputAmount: inputAmount.quotient.toString(),
                    }, 'Permit was provided for simulation on UR, checking that Permit2 has been approved.');
                    return permit2Allowance.gte(ethers_1.BigNumber.from(inputAmount.quotient.toString()));
                }
                // Check UR has been approved from Permit2.
                const permit2Contract = Permit2__factory_1.Permit2__factory.connect(universal_router_sdk_1.PERMIT2_ADDRESS, provider);
                const { amount: universalRouterAllowance, expiration: tokenExpiration } = yield permit2Contract.allowance(fromAddress, inputAmount.currency.wrapped.address, (0, util_1.SWAP_ROUTER_02_ADDRESSES)(this.chainId));
                const nowTimestampS = Math.round(Date.now() / 1000);
                const inputAmountBN = ethers_1.BigNumber.from(inputAmount.quotient.toString());
                const permit2Approved = permit2Allowance.gte(inputAmountBN);
                const universalRouterApproved = universalRouterAllowance.gte(inputAmountBN);
                const expirationValid = tokenExpiration > nowTimestampS;
                util_1.log.info({
                    permitAllowance: permit2Allowance.toString(),
                    tokenAllowance: universalRouterAllowance.toString(),
                    tokenExpirationS: tokenExpiration,
                    nowTimestampS,
                    inputAmount: inputAmount.quotient.toString(),
                    permit2Approved,
                    universalRouterApproved,
                    expirationValid,
                }, `Simulating on UR, Permit2 approved: ${permit2Approved}, UR approved: ${universalRouterApproved}, Expiraton valid: ${expirationValid}.`);
                return permit2Approved && universalRouterApproved && expirationValid;
            }
            else if (swapOptions.type == routers_1.SwapType.SWAP_ROUTER_02) {
                if (swapOptions.inputTokenPermit) {
                    util_1.log.info({
                        inputAmount: inputAmount.quotient.toString(),
                    }, 'Simulating on SwapRouter02 info - Permit was provided for simulation. Not checking allowances.');
                    return true;
                }
                const allowance = yield tokenContract.allowance(fromAddress, (0, util_1.SWAP_ROUTER_02_ADDRESSES)(this.chainId));
                const hasAllowance = allowance.gte(ethers_1.BigNumber.from(inputAmount.quotient.toString()));
                util_1.log.info({
                    hasAllowance,
                    allowance: allowance.toString(),
                    inputAmount: inputAmount.quotient.toString(),
                }, `Simulating on SwapRouter02 - Has allowance: ${hasAllowance}`);
                // Return true if token allowance is greater than input amount
                return hasAllowance;
            }
            throw new Error(`Unsupported swap type ${swapOptions}`);
        });
    }
}
exports.Simulator = Simulator;
