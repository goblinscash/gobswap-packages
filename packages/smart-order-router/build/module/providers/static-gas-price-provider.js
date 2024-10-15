export class StaticGasPriceProvider {
    constructor(gasPriceWei) {
        this.gasPriceWei = gasPriceWei;
    }
    async getGasPrice() {
        return { gasPriceWei: this.gasPriceWei };
    }
}
