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
exports.LegacyGasPriceProvider = void 0;
const util_1 = require("../util");
const gas_price_provider_1 = require("./gas-price-provider");
class LegacyGasPriceProvider extends gas_price_provider_1.IGasPriceProvider {
    constructor(provider) {
        super();
        this.provider = provider;
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            const gasPriceWei = yield this.provider.getGasPrice();
            util_1.log.info({ gasPriceWei }, `Got gas price ${gasPriceWei} using eth_gasPrice RPC`);
            return {
                gasPriceWei,
            };
        });
    }
}
exports.LegacyGasPriceProvider = LegacyGasPriceProvider;
