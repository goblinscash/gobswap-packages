import { BigNumber } from '@ethersproject/bignumber';
import retry from 'async-retry';
import axios from 'axios';
import { log } from '../util/log';
import { IGasPriceProvider } from './gas-price-provider';
export class ETHGasStationInfoProvider extends IGasPriceProvider {
    constructor(url) {
        super();
        this.url = url;
    }
    async getGasPrice() {
        log.info(`About to get gas prices from gas station ${this.url}`);
        const response = await retry(async () => {
            return axios.get(this.url);
        }, { retries: 1 });
        const { data: gasPriceResponse, status } = response;
        if (status != 200) {
            log.error({ response }, `Unabled to get gas price from ${this.url}.`);
            throw new Error(`Unable to get gas price from ${this.url}`);
        }
        log.info({ gasPriceResponse }, 'Gas price response from API. About to parse "fast" to big number');
        // Gas prices from ethgasstation are in GweiX10.
        const gasPriceWei = BigNumber.from(gasPriceResponse.fast)
            .div(BigNumber.from(10))
            .mul(BigNumber.from(10).pow(9));
        log.info(`Gas price in wei: ${gasPriceWei} as of block ${gasPriceResponse.blockNum}`);
        return { gasPriceWei: gasPriceWei };
    }
}
