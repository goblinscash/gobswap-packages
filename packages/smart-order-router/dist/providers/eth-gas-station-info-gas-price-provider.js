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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETHGasStationInfoProvider = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const async_retry_1 = __importDefault(require("async-retry"));
const axios_1 = __importDefault(require("axios"));
const log_1 = require("../util/log");
const gas_price_provider_1 = require("./gas-price-provider");
class ETHGasStationInfoProvider extends gas_price_provider_1.IGasPriceProvider {
    constructor(url) {
        super();
        this.url = url;
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.log.info(`About to get gas prices from gas station ${this.url}`);
            const response = yield (0, async_retry_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                return axios_1.default.get(this.url);
            }), { retries: 1 });
            const { data: gasPriceResponse, status } = response;
            if (status != 200) {
                log_1.log.error({ response }, `Unabled to get gas price from ${this.url}.`);
                throw new Error(`Unable to get gas price from ${this.url}`);
            }
            log_1.log.info({ gasPriceResponse }, 'Gas price response from API. About to parse "fast" to big number');
            // Gas prices from ethgasstation are in GweiX10.
            const gasPriceWei = bignumber_1.BigNumber.from(gasPriceResponse.fast)
                .div(bignumber_1.BigNumber.from(10))
                .mul(bignumber_1.BigNumber.from(10).pow(9));
            log_1.log.info(`Gas price in wei: ${gasPriceWei} as of block ${gasPriceResponse.blockNum}`);
            return { gasPriceWei: gasPriceWei };
        });
    }
}
exports.ETHGasStationInfoProvider = ETHGasStationInfoProvider;
