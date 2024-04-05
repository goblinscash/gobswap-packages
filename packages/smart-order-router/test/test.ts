// import { Currency } from './../../sdk-core/src/entities/currency';
import { ChainId, /*NativeCurrency,*/ Token, TradeType } from "@uniswap/sdk-core";
import { AlphaRouter, parseAmount } from "../src";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Protocol } from '@uniswap/router-sdk';

// console.log(AlphaRouter);
const chainProvider = 'https://smartbch.greyh.at'; // ID_TO_PROVIDER(ChainId.SMARTBCH);
// const chainProvider = 'https://smartbch.fountainhead.cash/mainnet'; // ID_TO_PROVIDER(ChainId.SMARTBCH);
const provider = new JsonRpcProvider(chainProvider);
var router = new AlphaRouter({ chainId: ChainId.SMARTBCH, provider });

// class SbchNativeCurrency extends NativeCurrency {
//   equals(other: Currency): boolean {
//     return other.isNative && other.chainId === this.chainId
//   }

//   get wrapped(): Token {
//     return new Token(
//       ChainId.SMARTBCH,
//       '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04',
//       18,
//       'WBCH',
//       'Wrapped BCH'
//     )
//   }

//   public constructor(chainId: number) {
//     super(chainId, 18, 'BCH', 'BCH')
//   }
// }
// const tokenIn = new SbchNativeCurrency(ChainId.SMARTBCH);
const tokenIn = new Token(
  ChainId.SMARTBCH,
  '0xbc2f884680c95a02cea099da2f524b366d9028ba',
  18,
  'bcUSDT',
  'bcUSDT'
)
const tokenOut = new Token(
  ChainId.SMARTBCH,
  '0xbc9bd8dde6c5a8e1cbe293356e02f5984693b195',
  18,
  'bcBCH',
  'bcBCH'
)


var amount = parseAmount('1', tokenIn);
router.route(amount, tokenOut, TradeType.EXACT_INPUT, undefined, { protocols: [Protocol.V2, Protocol.V3] })
  .then(routes => {
    console.log(JSON.stringify(routes));
    routes?.route.forEach(r => {
      console.log(r.amount.quotient.toString());
      console.log(r.quote.quotient.toString());
    })

  }).catch(error => console.log(error))
