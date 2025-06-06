'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var invariant = _interopDefault(require('tiny-invariant'));
var UniversalRouter_json = require('@uniswap/universal-router/artifacts/contracts/UniversalRouter.sol/UniversalRouter.json');
var abi$7 = require('@ethersproject/abi');
var ethers = require('ethers');
var utils = require('ethers/lib/utils');
var v2Sdk = require('@uniswap/v2-sdk');
var v3Sdk = require('@uniswap/v3-sdk');
var routerSdk = require('@uniswap/router-sdk');
var sdkCore = require('@uniswap/sdk-core');
require('jsbi');
require('bignumber.js');

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

(function (RouterTradeType) {
  RouterTradeType["UniswapTrade"] = "UniswapTrade";
  RouterTradeType["NFTTrade"] = "NFTTrade";
  RouterTradeType["UnwrapWETH"] = "UnwrapWETH";
})(exports.RouterTradeType || (exports.RouterTradeType = {}));

var NFTTrade = function NFTTrade(market, orders) {
  this.tradeType = exports.RouterTradeType.NFTTrade;
  !(orders.length > 0) ?  invariant(false, 'no buy Items')  : void 0;
  this.market = market;
  this.orders = orders;
};
(function (Market) {
  Market["Foundation"] = "foundation";
  Market["LooksRareV2"] = "looksrareV2";
  Market["NFT20"] = "nft20";
  Market["NFTX"] = "nftx";
  Market["Seaport"] = "seaport";
  Market["Sudoswap"] = "Sudoswap";
  Market["Cryptopunks"] = "cryptopunks";
  Market["X2Y2"] = "x2y2";
  Market["Element"] = "element";
})(exports.Market || (exports.Market = {}));
(function (TokenType) {
  TokenType["ERC721"] = "ERC721";
  TokenType["ERC1155"] = "ERC1155";
  TokenType["Cryptopunk"] = "Cryptopunk";
})(exports.TokenType || (exports.TokenType = {}));

var _ABI_DEFINITION;
/**
 * CommandTypes
 * @description Flags that modify a command's execution
 * @enum {number}
 */
var CommandType;
(function (CommandType) {
  CommandType[CommandType["V3_SWAP_EXACT_IN"] = 0] = "V3_SWAP_EXACT_IN";
  CommandType[CommandType["V3_SWAP_EXACT_OUT"] = 1] = "V3_SWAP_EXACT_OUT";
  CommandType[CommandType["PERMIT2_TRANSFER_FROM"] = 2] = "PERMIT2_TRANSFER_FROM";
  CommandType[CommandType["PERMIT2_PERMIT_BATCH"] = 3] = "PERMIT2_PERMIT_BATCH";
  CommandType[CommandType["SWEEP"] = 4] = "SWEEP";
  CommandType[CommandType["TRANSFER"] = 5] = "TRANSFER";
  CommandType[CommandType["PAY_PORTION"] = 6] = "PAY_PORTION";
  CommandType[CommandType["V2_SWAP_EXACT_IN"] = 8] = "V2_SWAP_EXACT_IN";
  CommandType[CommandType["V2_SWAP_EXACT_OUT"] = 9] = "V2_SWAP_EXACT_OUT";
  CommandType[CommandType["PERMIT2_PERMIT"] = 10] = "PERMIT2_PERMIT";
  CommandType[CommandType["WRAP_ETH"] = 11] = "WRAP_ETH";
  CommandType[CommandType["UNWRAP_WETH"] = 12] = "UNWRAP_WETH";
  CommandType[CommandType["PERMIT2_TRANSFER_FROM_BATCH"] = 13] = "PERMIT2_TRANSFER_FROM_BATCH";
  CommandType[CommandType["BALANCE_CHECK_ERC20"] = 14] = "BALANCE_CHECK_ERC20";
  // NFT-related command types
  CommandType[CommandType["SEAPORT_V1_5"] = 16] = "SEAPORT_V1_5";
  CommandType[CommandType["LOOKS_RARE_V2"] = 17] = "LOOKS_RARE_V2";
  CommandType[CommandType["NFTX"] = 18] = "NFTX";
  CommandType[CommandType["CRYPTOPUNKS"] = 19] = "CRYPTOPUNKS";
  // 0x14
  CommandType[CommandType["OWNER_CHECK_721"] = 21] = "OWNER_CHECK_721";
  CommandType[CommandType["OWNER_CHECK_1155"] = 22] = "OWNER_CHECK_1155";
  CommandType[CommandType["SWEEP_ERC721"] = 23] = "SWEEP_ERC721";
  CommandType[CommandType["X2Y2_721"] = 24] = "X2Y2_721";
  CommandType[CommandType["SUDOSWAP"] = 25] = "SUDOSWAP";
  CommandType[CommandType["NFT20"] = 26] = "NFT20";
  CommandType[CommandType["X2Y2_1155"] = 27] = "X2Y2_1155";
  CommandType[CommandType["FOUNDATION"] = 28] = "FOUNDATION";
  CommandType[CommandType["SWEEP_ERC1155"] = 29] = "SWEEP_ERC1155";
  CommandType[CommandType["ELEMENT_MARKET"] = 30] = "ELEMENT_MARKET";
  CommandType[CommandType["SEAPORT_V1_4"] = 32] = "SEAPORT_V1_4";
  CommandType[CommandType["EXECUTE_SUB_PLAN"] = 33] = "EXECUTE_SUB_PLAN";
  CommandType[CommandType["APPROVE_ERC20"] = 34] = "APPROVE_ERC20";
})(CommandType || (CommandType = {}));
var ALLOW_REVERT_FLAG = 0x80;
var REVERTIBLE_COMMANDS = /*#__PURE__*/new Set([CommandType.SEAPORT_V1_5, CommandType.SEAPORT_V1_4, CommandType.NFTX, CommandType.LOOKS_RARE_V2, CommandType.X2Y2_721, CommandType.X2Y2_1155, CommandType.FOUNDATION, CommandType.SUDOSWAP, CommandType.NFT20, CommandType.EXECUTE_SUB_PLAN, CommandType.CRYPTOPUNKS, CommandType.ELEMENT_MARKET]);
var PERMIT_STRUCT = '((address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline)';
var PERMIT_BATCH_STRUCT = '((address token,uint160 amount,uint48 expiration,uint48 nonce)[] details,address spender,uint256 sigDeadline)';
var PERMIT2_TRANSFER_FROM_STRUCT = '(address from,address to,uint160 amount,address token)';
var PERMIT2_TRANSFER_FROM_BATCH_STRUCT = PERMIT2_TRANSFER_FROM_STRUCT + '[]';
var ABI_DEFINITION = (_ABI_DEFINITION = {}, _ABI_DEFINITION[CommandType.EXECUTE_SUB_PLAN] = ['bytes', 'bytes[]'], _ABI_DEFINITION[CommandType.PERMIT2_PERMIT] = [PERMIT_STRUCT, 'bytes'], _ABI_DEFINITION[CommandType.PERMIT2_PERMIT_BATCH] = [PERMIT_BATCH_STRUCT, 'bytes'], _ABI_DEFINITION[CommandType.PERMIT2_TRANSFER_FROM] = ['address', 'address', 'uint160'], _ABI_DEFINITION[CommandType.PERMIT2_TRANSFER_FROM_BATCH] = [PERMIT2_TRANSFER_FROM_BATCH_STRUCT], _ABI_DEFINITION[CommandType.V3_SWAP_EXACT_IN] = ['address', 'uint256', 'uint256', 'bytes', 'bool'], _ABI_DEFINITION[CommandType.V3_SWAP_EXACT_OUT] = ['address', 'uint256', 'uint256', 'bytes', 'bool'], _ABI_DEFINITION[CommandType.V2_SWAP_EXACT_IN] = ['address', 'uint256', 'uint256', 'address[]', 'bool'], _ABI_DEFINITION[CommandType.V2_SWAP_EXACT_OUT] = ['address', 'uint256', 'uint256', 'address[]', 'bool'], _ABI_DEFINITION[CommandType.WRAP_ETH] = ['address', 'uint256'], _ABI_DEFINITION[CommandType.UNWRAP_WETH] = ['address', 'uint256'], _ABI_DEFINITION[CommandType.SWEEP] = ['address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.SWEEP_ERC721] = ['address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.SWEEP_ERC1155] = ['address', 'address', 'uint256', 'uint256'], _ABI_DEFINITION[CommandType.TRANSFER] = ['address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.PAY_PORTION] = ['address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.BALANCE_CHECK_ERC20] = ['address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.OWNER_CHECK_721] = ['address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.OWNER_CHECK_1155] = ['address', 'address', 'uint256', 'uint256'], _ABI_DEFINITION[CommandType.APPROVE_ERC20] = ['address', 'uint256'], _ABI_DEFINITION[CommandType.SEAPORT_V1_5] = ['uint256', 'bytes'], _ABI_DEFINITION[CommandType.SEAPORT_V1_4] = ['uint256', 'bytes'], _ABI_DEFINITION[CommandType.NFTX] = ['uint256', 'bytes'], _ABI_DEFINITION[CommandType.LOOKS_RARE_V2] = ['uint256', 'bytes'], _ABI_DEFINITION[CommandType.X2Y2_721] = ['uint256', 'bytes', 'address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.X2Y2_1155] = ['uint256', 'bytes', 'address', 'address', 'uint256', 'uint256'], _ABI_DEFINITION[CommandType.FOUNDATION] = ['uint256', 'bytes', 'address', 'address', 'uint256'], _ABI_DEFINITION[CommandType.SUDOSWAP] = ['uint256', 'bytes'], _ABI_DEFINITION[CommandType.NFT20] = ['uint256', 'bytes'], _ABI_DEFINITION[CommandType.CRYPTOPUNKS] = ['uint256', 'address', 'uint256'], _ABI_DEFINITION[CommandType.ELEMENT_MARKET] = ['uint256', 'bytes'], _ABI_DEFINITION);
var RoutePlanner = /*#__PURE__*/function () {
  function RoutePlanner() {
    this.commands = '0x';
    this.inputs = [];
  }
  var _proto = RoutePlanner.prototype;
  _proto.addSubPlan = function addSubPlan(subplan) {
    this.addCommand(CommandType.EXECUTE_SUB_PLAN, [subplan.commands, subplan.inputs], true);
  };
  _proto.addCommand = function addCommand(type, parameters, allowRevert) {
    if (allowRevert === void 0) {
      allowRevert = false;
    }
    var command = createCommand(type, parameters);
    this.inputs.push(command.encodedInput);
    if (allowRevert) {
      if (!REVERTIBLE_COMMANDS.has(command.type)) {
        throw new Error("command type: " + command.type + " cannot be allowed to revert");
      }
      command.type = command.type | ALLOW_REVERT_FLAG;
    }
    this.commands = this.commands.concat(command.type.toString(16).padStart(2, '0'));
  };
  return RoutePlanner;
}();
function createCommand(type, parameters) {
  var encodedInput = utils.defaultAbiCoder.encode(ABI_DEFINITION[type], parameters);
  return {
    type: type,
    encodedInput: encodedInput
  };
}

var _CHAIN_CONFIGS;
var WETH_NOT_SUPPORTED_ON_CHAIN = '0x0000000000000000000000000000000000000000';
var CHAIN_CONFIGS = (_CHAIN_CONFIGS = {}, _CHAIN_CONFIGS[1] = {
  router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  creationBlock: 17143817
}, _CHAIN_CONFIGS[5] = {
  router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  weth: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
  creationBlock: 8940568
}, _CHAIN_CONFIGS[11155111] = {
  router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  creationBlock: 3543575
}, _CHAIN_CONFIGS[137] = {
  router: '0x643770E279d5D0733F21d6DC03A8efbABf3255B4',
  weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  creationBlock: 46866777
}, _CHAIN_CONFIGS[80001] = {
  router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  weth: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
  creationBlock: 35176052
}, _CHAIN_CONFIGS[10] = {
  router: '0xE44a0A73F25D36185117473d7adEADD7D83fF5Dc',
  weth: '0x4200000000000000000000000000000000000006',
  creationBlock: 108825869
}, _CHAIN_CONFIGS[420] = {
  router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  weth: '0x4200000000000000000000000000000000000006',
  creationBlock: 8887728
}, _CHAIN_CONFIGS[42161] = {
  router: '0xE44a0A73F25D36185117473d7adEADD7D83fF5Dc',
  weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  creationBlock: 125861718
}, _CHAIN_CONFIGS[421613] = {
  router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  weth: '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3',
  creationBlock: 18815277
}, _CHAIN_CONFIGS[42220] = {
  router: '0x88a3ED7F21A3fCF6adb86b6F878C5B7a02D20e9b',
  weth: WETH_NOT_SUPPORTED_ON_CHAIN,
  creationBlock: 21116361
}, _CHAIN_CONFIGS[44787] = {
  router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  weth: WETH_NOT_SUPPORTED_ON_CHAIN,
  creationBlock: 17566658
}, _CHAIN_CONFIGS[56] = {
  router: '0xE44a0A73F25D36185117473d7adEADD7D83fF5Dc',
  weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  creationBlock: 31254967
}, _CHAIN_CONFIGS[43114] = {
  router: '0x82635AF6146972cD6601161c4472ffe97237D292',
  weth: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
  creationBlock: 34491144
}, _CHAIN_CONFIGS[84531] = {
  router: '0xd0872d928672ae2ff74bdb2f5130ac12229cafaf',
  weth: '0x4200000000000000000000000000000000000006',
  creationBlock: 6915289
}, _CHAIN_CONFIGS[8453] = {
  router: '0x59B804e8cE21221A2F68802526b8017ea28C07f3',
  weth: '0x4200000000000000000000000000000000000006',
  creationBlock: 3229053
}, _CHAIN_CONFIGS[10000] = {
  router: '0x23a9379Eab50cf0d66a843082792474b6afA5AEF',
  weth: '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04',
  creationBlock: 14474678
}, _CHAIN_CONFIGS);
var UNIVERSAL_ROUTER_ADDRESS = function UNIVERSAL_ROUTER_ADDRESS(chainId) {
  if (!(chainId in CHAIN_CONFIGS)) throw new Error("Universal Router not deployed on chain " + chainId);
  return CHAIN_CONFIGS[chainId].router;
};
var UNIVERSAL_ROUTER_CREATION_BLOCK = function UNIVERSAL_ROUTER_CREATION_BLOCK(chainId) {
  if (!(chainId in CHAIN_CONFIGS)) throw new Error("Universal Router not deployed on chain " + chainId);
  return CHAIN_CONFIGS[chainId].creationBlock;
};
var WETH_ADDRESS = function WETH_ADDRESS(chainId) {
  if (!(chainId in CHAIN_CONFIGS)) throw new Error("Universal Router not deployed on chain " + chainId);
  if (CHAIN_CONFIGS[chainId].weth == WETH_NOT_SUPPORTED_ON_CHAIN) throw new Error("Chain " + chainId + " does not have WETH");
  return CHAIN_CONFIGS[chainId].weth;
};
var PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
var CONTRACT_BALANCE = /*#__PURE__*/ethers.BigNumber.from(2).pow(255);
var ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
var ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
var SENDER_AS_RECIPIENT = '0x0000000000000000000000000000000000000001';
var ROUTER_AS_RECIPIENT = '0x0000000000000000000000000000000000000002';
var OPENSEA_CONDUIT_SPENDER_ID = 0;
var SUDOSWAP_SPENDER_ID = 1;

function encodeFeeBips(fee) {
  return v3Sdk.toHex(fee.multiply(10000).quotient);
}

var REFUND_ETH_PRICE_IMPACT_THRESHOLD = /*#__PURE__*/new sdkCore.Percent(50, 100);
// Wrapper for uniswap router-sdk trade entity to encode swaps for Universal Router
// also translates trade objects from previous (v2, v3) SDKs
var UniswapTrade = /*#__PURE__*/function () {
  function UniswapTrade(trade, options) {
    this.trade = trade;
    this.options = options;
    this.tradeType = exports.RouterTradeType.UniswapTrade;
    if (!!options.fee && !!options.flatFee) throw new Error('Only one fee option permitted');
  }
  var _proto = UniswapTrade.prototype;
  _proto.encode = function encode(planner, _config) {
    var _this$options$recipie;
    var payerIsUser = true;
    // If the input currency is the native currency, we need to wrap it with the router as the recipient
    if (this.trade.inputAmount.currency.isNative) {
      // TODO: optimize if only one v2 pool we can directly send this to the pool
      planner.addCommand(CommandType.WRAP_ETH, [ROUTER_AS_RECIPIENT, this.trade.maximumAmountIn(this.options.slippageTolerance).quotient.toString()]);
      // since WETH is now owned by the router, the router pays for inputs
      payerIsUser = false;
    }
    // The overall recipient at the end of the trade, SENDER_AS_RECIPIENT uses the msg.sender
    this.options.recipient = (_this$options$recipie = this.options.recipient) != null ? _this$options$recipie : SENDER_AS_RECIPIENT;
    // flag for whether we want to perform slippage check on aggregate output of multiple routes
    //   1. when there are >2 exact input trades. this is only a heuristic,
    //      as it's still more gas-expensive even in this case, but has benefits
    //      in that the reversion probability is lower
    var performAggregatedSlippageCheck = this.trade.tradeType === sdkCore.TradeType.EXACT_INPUT && this.trade.routes.length > 2;
    var outputIsNative = this.trade.outputAmount.currency.isNative;
    var inputIsNative = this.trade.inputAmount.currency.isNative;
    var routerMustCustody = performAggregatedSlippageCheck || outputIsNative || hasFeeOption(this.options);
    for (var _iterator = _createForOfIteratorHelperLoose(this.trade.swaps), _step; !(_step = _iterator()).done;) {
      var swap = _step.value;
      switch (swap.route.protocol) {
        case routerSdk.Protocol.V2:
          addV2Swap(planner, swap, this.trade.tradeType, this.options, payerIsUser, routerMustCustody);
          break;
        case routerSdk.Protocol.V3:
          addV3Swap(planner, swap, this.trade.tradeType, this.options, payerIsUser, routerMustCustody);
          break;
        case routerSdk.Protocol.MIXED:
          addMixedSwap(planner, swap, this.trade.tradeType, this.options, payerIsUser, routerMustCustody);
          break;
        default:
          throw new Error('UNSUPPORTED_TRADE_PROTOCOL');
      }
    }
    var minimumAmountOut = ethers.BigNumber.from(this.trade.minimumAmountOut(this.options.slippageTolerance).quotient.toString());
    // The router custodies for 3 reasons: to unwrap, to take a fee, and/or to do a slippage check
    if (routerMustCustody) {
      // If there is a fee, that percentage is sent to the fee recipient
      // In the case where ETH is the output currency, the fee is taken in WETH (for gas reasons)
      if (!!this.options.fee) {
        var feeBips = encodeFeeBips(this.options.fee.fee);
        planner.addCommand(CommandType.PAY_PORTION, [this.trade.outputAmount.currency.wrapped.address, this.options.fee.recipient, feeBips]);
        // If the trade is exact output, and a fee was taken, we must adjust the amount out to be the amount after the fee
        // Otherwise we continue as expected with the trade's normal expected output
        if (this.trade.tradeType === sdkCore.TradeType.EXACT_OUTPUT) {
          minimumAmountOut = minimumAmountOut.sub(minimumAmountOut.mul(feeBips).div(10000));
        }
      }
      // If there is a flat fee, that absolute amount is sent to the fee recipient
      // In the case where ETH is the output currency, the fee is taken in WETH (for gas reasons)
      if (!!this.options.flatFee) {
        var feeAmount = this.options.flatFee.amount;
        if (minimumAmountOut.lt(feeAmount)) throw new Error('Flat fee amount greater than minimumAmountOut');
        planner.addCommand(CommandType.TRANSFER, [this.trade.outputAmount.currency.wrapped.address, this.options.flatFee.recipient, feeAmount]);
        // If the trade is exact output, and a fee was taken, we must adjust the amount out to be the amount after the fee
        // Otherwise we continue as expected with the trade's normal expected output
        if (this.trade.tradeType === sdkCore.TradeType.EXACT_OUTPUT) {
          minimumAmountOut = minimumAmountOut.sub(feeAmount);
        }
      }
      // The remaining tokens that need to be sent to the user after the fee is taken will be caught
      // by this if-else clause.
      if (outputIsNative) {
        planner.addCommand(CommandType.UNWRAP_WETH, [this.options.recipient, minimumAmountOut]);
      } else {
        planner.addCommand(CommandType.SWEEP, [this.trade.outputAmount.currency.wrapped.address, this.options.recipient, minimumAmountOut]);
      }
    }
    if (inputIsNative && (this.trade.tradeType === sdkCore.TradeType.EXACT_OUTPUT || riskOfPartialFill(this.trade))) {
      // for exactOutput swaps that take native currency as input
      // we need to send back the change to the user
      planner.addCommand(CommandType.UNWRAP_WETH, [this.options.recipient, 0]);
    }
  };
  return UniswapTrade;
}();
// encode a uniswap v2 swap
function addV2Swap(planner, _ref, tradeType, options, payerIsUser, routerMustCustody) {
  var route = _ref.route,
    inputAmount = _ref.inputAmount,
    outputAmount = _ref.outputAmount;
  var trade = new v2Sdk.Trade(route, tradeType == sdkCore.TradeType.EXACT_INPUT ? inputAmount : outputAmount, tradeType);
  if (tradeType == sdkCore.TradeType.EXACT_INPUT) {
    planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
    // if native, we have to unwrap so keep in the router for now
    routerMustCustody ? ROUTER_AS_RECIPIENT : options.recipient, trade.maximumAmountIn(options.slippageTolerance).quotient.toString(), trade.minimumAmountOut(options.slippageTolerance).quotient.toString(), route.path.map(function (pool) {
      return pool.address;
    }), payerIsUser]);
  } else if (tradeType == sdkCore.TradeType.EXACT_OUTPUT) {
    planner.addCommand(CommandType.V2_SWAP_EXACT_OUT, [routerMustCustody ? ROUTER_AS_RECIPIENT : options.recipient, trade.minimumAmountOut(options.slippageTolerance).quotient.toString(), trade.maximumAmountIn(options.slippageTolerance).quotient.toString(), route.path.map(function (pool) {
      return pool.address;
    }), payerIsUser]);
  }
}
// encode a uniswap v3 swap
function addV3Swap(planner, _ref2, tradeType, options, payerIsUser, routerMustCustody) {
  var route = _ref2.route,
    inputAmount = _ref2.inputAmount,
    outputAmount = _ref2.outputAmount;
  var trade = v3Sdk.Trade.createUncheckedTrade({
    route: route,
    inputAmount: inputAmount,
    outputAmount: outputAmount,
    tradeType: tradeType
  });
  var path = v3Sdk.encodeRouteToPath(route, trade.tradeType === sdkCore.TradeType.EXACT_OUTPUT);
  if (tradeType == sdkCore.TradeType.EXACT_INPUT) {
    planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [routerMustCustody ? ROUTER_AS_RECIPIENT : options.recipient, trade.maximumAmountIn(options.slippageTolerance).quotient.toString(), trade.minimumAmountOut(options.slippageTolerance).quotient.toString(), path, payerIsUser]);
  } else if (tradeType == sdkCore.TradeType.EXACT_OUTPUT) {
    planner.addCommand(CommandType.V3_SWAP_EXACT_OUT, [routerMustCustody ? ROUTER_AS_RECIPIENT : options.recipient, trade.minimumAmountOut(options.slippageTolerance).quotient.toString(), trade.maximumAmountIn(options.slippageTolerance).quotient.toString(), path, payerIsUser]);
  }
}
// encode a mixed route swap, i.e. including both v2 and v3 pools
function addMixedSwap(planner, swap, tradeType, options, payerIsUser, routerMustCustody) {
  var route = swap.route,
    inputAmount = swap.inputAmount,
    outputAmount = swap.outputAmount;
  var tradeRecipient = routerMustCustody ? ROUTER_AS_RECIPIENT : options.recipient;
  // single hop, so it can be reduced to plain v2 or v3 swap logic
  if (route.pools.length === 1) {
    if (route.pools[0] instanceof v3Sdk.Pool) {
      return addV3Swap(planner, swap, tradeType, options, payerIsUser, routerMustCustody);
    } else if (route.pools[0] instanceof v2Sdk.Pair) {
      return addV2Swap(planner, swap, tradeType, options, payerIsUser, routerMustCustody);
    } else {
      throw new Error('Invalid route type');
    }
  }
  var trade = routerSdk.MixedRouteTrade.createUncheckedTrade({
    route: route,
    inputAmount: inputAmount,
    outputAmount: outputAmount,
    tradeType: tradeType
  });
  var amountIn = trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient.toString();
  var amountOut = trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient.toString();
  // logic from
  // https://github.com/Uniswap/router-sdk/blob/d8eed164e6c79519983844ca8b6a3fc24ebcb8f8/src/swapRouter.ts#L276
  var sections = routerSdk.partitionMixedRouteByProtocol(route);
  var isLastSectionInRoute = function isLastSectionInRoute(i) {
    return i === sections.length - 1;
  };
  var outputToken;
  var inputToken = route.input.wrapped;
  for (var i = 0; i < sections.length; i++) {
    var section = sections[i];
    /// Now, we get output of this section
    outputToken = routerSdk.getOutputOfPools(section, inputToken);
    var newRouteOriginal = new routerSdk.MixedRouteSDK([].concat(section), section[0].token0.equals(inputToken) ? section[0].token0 : section[0].token1, outputToken);
    var newRoute = new routerSdk.MixedRoute(newRouteOriginal);
    /// Previous output is now input
    inputToken = outputToken;
    var mixedRouteIsAllV3 = function mixedRouteIsAllV3(route) {
      return route.pools.every(function (pool) {
        return pool instanceof v3Sdk.Pool;
      });
    };
    if (mixedRouteIsAllV3(newRoute)) {
      var path = routerSdk.encodeMixedRouteToPath(newRoute);
      planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
      // if not last section: send tokens directly to the first v2 pair of the next section
      // note: because of the partitioning function we can be sure that the next section is v2
      isLastSectionInRoute(i) ? tradeRecipient : sections[i + 1][0].liquidityToken.address, i == 0 ? amountIn : CONTRACT_BALANCE, !isLastSectionInRoute(i) ? 0 : amountOut, path, payerIsUser && i === 0]);
    } else {
      planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [isLastSectionInRoute(i) ? tradeRecipient : ROUTER_AS_RECIPIENT, i === 0 ? amountIn : CONTRACT_BALANCE, !isLastSectionInRoute(i) ? 0 : amountOut, newRoute.path.map(function (pool) {
        return pool.address;
      }), payerIsUser && i === 0]);
    }
  }
}
// if price impact is very high, there's a chance of hitting max/min prices resulting in a partial fill of the swap
function riskOfPartialFill(trade) {
  return trade.priceImpact.greaterThan(REFUND_ETH_PRICE_IMPACT_THRESHOLD);
}
function hasFeeOption(swapOptions) {
  return !!swapOptions.fee || !!swapOptions.flatFee;
}

var SIGNATURE_LENGTH = 65;
var EIP_2098_SIGNATURE_LENGTH = 64;
function encodePermit(planner, permit2) {
  var signature = permit2.signature;
  var length = ethers.ethers.utils.arrayify(permit2.signature).length;
  // signature data provided for EIP-1271 may have length different from ECDSA signature
  if (length === SIGNATURE_LENGTH || length === EIP_2098_SIGNATURE_LENGTH) {
    // sanitizes signature to cover edge cases of malformed EIP-2098 sigs and v used as recovery id
    signature = ethers.ethers.utils.joinSignature(ethers.ethers.utils.splitSignature(permit2.signature));
  }
  planner.addCommand(CommandType.PERMIT2_PERMIT, [permit2, signature]);
}
// Handles the encoding of commands needed to gather input tokens for a trade
// Approval: The router approving another address to take tokens.
//   note: Only seaport and sudoswap support this action. Approvals are left open.
// Permit: A Permit2 signature-based Permit to allow the router to access a user's tokens
// Transfer: A Permit2 TransferFrom of tokens from a user to either the router or another address
function encodeInputTokenOptions(planner, options) {
  // first ensure that all tokens provided for encoding are the same
  if (!!options.approval && !!options.permit2Permit) !(options.approval.token === options.permit2Permit.details.token) ?  invariant(false, "inconsistent token")  : void 0;
  if (!!options.approval && !!options.permit2TransferFrom) !(options.approval.token === options.permit2TransferFrom.token) ?  invariant(false, "inconsistent token")  : void 0;
  if (!!options.permit2TransferFrom && !!options.permit2Permit) !(options.permit2TransferFrom.token === options.permit2Permit.details.token) ?  invariant(false, "inconsistent token")  : void 0;
  // if an options.approval is required, add it
  if (!!options.approval) {
    planner.addCommand(CommandType.APPROVE_ERC20, [options.approval.token, mapApprovalProtocol(options.approval.protocol)]);
  }
  // if this order has a options.permit2Permit, encode it
  if (!!options.permit2Permit) {
    encodePermit(planner, options.permit2Permit);
  }
  if (!!options.permit2TransferFrom) {
    planner.addCommand(CommandType.PERMIT2_TRANSFER_FROM, [options.permit2TransferFrom.token, options.permit2TransferFrom.recipient ? options.permit2TransferFrom.recipient : ROUTER_AS_RECIPIENT, options.permit2TransferFrom.amount]);
  }
}
function mapApprovalProtocol(protocolAddress) {
  switch (protocolAddress.toLowerCase()) {
    case '0x00000000000000adc04c56bf30ac9d3c0aaf14dc':
      // Seaport v1.5
      return OPENSEA_CONDUIT_SPENDER_ID;
    case '0x00000000000001ad428e4906ae43d8f9852d0dd6':
      // Seaport v1.4
      return OPENSEA_CONDUIT_SPENDER_ID;
    case '0x2b2e8cda09bba9660dca5cb6233787738ad68329':
      // Sudoswap
      return SUDOSWAP_SPENDER_ID;
    default:
      throw new Error('unsupported protocol address');
  }
}

var SwapRouter = /*#__PURE__*/function () {
  function SwapRouter() {}
  SwapRouter.swapCallParameters = function swapCallParameters(trades, config) {
    if (config === void 0) {
      config = {};
    }
    if (!Array.isArray(trades)) trades = [trades];
    var nftTrades = trades.filter(function (trade, _, _ref) {
      return trade.hasOwnProperty('market');
    });
    var allowRevert = nftTrades.length == 1 && nftTrades[0].orders.length == 1 ? false : true;
    var planner = new RoutePlanner();
    // track value flow to require the right amount of native value
    var currentNativeValueInRouter = ethers.BigNumber.from(0);
    var transactionValue = ethers.BigNumber.from(0);
    // tracks the input tokens (and ETH) used to buy NFTs to allow us to sweep
    var nftInputTokens = new Set();
    for (var _iterator = _createForOfIteratorHelperLoose(trades), _step; !(_step = _iterator()).done;) {
      var trade = _step.value;
      /**
       * is NFTTrade
       */
      if (trade.tradeType == exports.RouterTradeType.NFTTrade) {
        var nftTrade = trade;
        nftTrade.encode(planner, {
          allowRevert: allowRevert
        });
        var tradePrice = nftTrade.getTotalPrice();
        if (nftTrade.market == exports.Market.Seaport) {
          var seaportTrade = nftTrade;
          var seaportInputTokens = seaportTrade.getInputTokens();
          seaportInputTokens.forEach(function (inputToken) {
            nftInputTokens.add(inputToken);
          });
        } else {
          nftInputTokens.add(ETH_ADDRESS);
        }
        // send enough native value to contract for NFT purchase
        if (currentNativeValueInRouter.lt(tradePrice)) {
          transactionValue = transactionValue.add(tradePrice.sub(currentNativeValueInRouter));
          currentNativeValueInRouter = ethers.BigNumber.from(0);
        } else {
          currentNativeValueInRouter = currentNativeValueInRouter.sub(tradePrice);
        }
        /**
         * is UniswapTrade
         */
      } else if (trade.tradeType == exports.RouterTradeType.UniswapTrade) {
        var uniswapTrade = trade;
        var inputIsNative = uniswapTrade.trade.inputAmount.currency.isNative;
        var outputIsNative = uniswapTrade.trade.outputAmount.currency.isNative;
        var swapOptions = uniswapTrade.options;
        !!(inputIsNative && !!swapOptions.inputTokenPermit) ?  invariant(false, 'NATIVE_INPUT_PERMIT')  : void 0;
        if (!!swapOptions.inputTokenPermit) {
          encodePermit(planner, swapOptions.inputTokenPermit);
        }
        if (inputIsNative) {
          transactionValue = transactionValue.add(ethers.BigNumber.from(uniswapTrade.trade.maximumAmountIn(swapOptions.slippageTolerance).quotient.toString()));
        }
        // track amount of native currency in the router
        if (outputIsNative && swapOptions.recipient == ROUTER_AS_RECIPIENT) {
          currentNativeValueInRouter = currentNativeValueInRouter.add(ethers.BigNumber.from(uniswapTrade.trade.minimumAmountOut(swapOptions.slippageTolerance).quotient.toString()));
        }
        uniswapTrade.encode(planner, {
          allowRevert: false
        });
        /**
         * is UnwrapWETH
         */
      } else if (trade.tradeType == exports.RouterTradeType.UnwrapWETH) {
        var UnwrapWETH = trade;
        trade.encode(planner, {
          allowRevert: false
        });
        currentNativeValueInRouter = currentNativeValueInRouter.add(UnwrapWETH.amount);
        /**
         * else
         */
      } else {
        throw 'trade must be of instance: UniswapTrade or NFTTrade';
      }
    }
    // TODO: matches current logic for now, but should eventually only sweep for multiple NFT trades
    // or NFT trades with potential slippage (i.e. sudo).
    // Note: NFTXV2 sends excess ETH to the caller (router), not the specified recipient
    nftInputTokens.forEach(function (inputToken) {
      planner.addCommand(CommandType.SWEEP, [inputToken, SENDER_AS_RECIPIENT, 0]);
    });
    return SwapRouter.encodePlan(planner, transactionValue, config);
  }
  /**
   * @deprecated in favor of swapCallParameters. Update before next major version 2.0.0
   * This version does not work correctly for Seaport ERC20->NFT purchases
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given swap.
   * @param trades to produce call parameters for
   */;
  SwapRouter.swapNFTCallParameters = function swapNFTCallParameters(trades, config) {
    if (config === void 0) {
      config = {};
    }
    var planner = new RoutePlanner();
    var totalPrice = ethers.BigNumber.from(0);
    var allowRevert = trades.length == 1 && trades[0].orders.length == 1 ? false : true;
    for (var _iterator2 = _createForOfIteratorHelperLoose(trades), _step2; !(_step2 = _iterator2()).done;) {
      var trade = _step2.value;
      trade.encode(planner, {
        allowRevert: allowRevert
      });
      totalPrice = totalPrice.add(trade.getTotalPrice());
    }
    planner.addCommand(CommandType.SWEEP, [ETH_ADDRESS, SENDER_AS_RECIPIENT, 0]);
    return SwapRouter.encodePlan(planner, totalPrice, config);
  }
  /**
   * @deprecated in favor of swapCallParameters. Update before next major version 2.0.0
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trades to produce call parameters for
   * @param options options for the call parameters
   */;
  SwapRouter.swapERC20CallParameters = function swapERC20CallParameters(trades, options) {
    // TODO: use permit if signature included in swapOptions
    var planner = new RoutePlanner();
    var trade = new UniswapTrade(trades, options);
    var inputCurrency = trade.trade.inputAmount.currency;
    !!(inputCurrency.isNative && !!options.inputTokenPermit) ?  invariant(false, 'NATIVE_INPUT_PERMIT')  : void 0;
    if (options.inputTokenPermit) {
      encodePermit(planner, options.inputTokenPermit);
    }
    var nativeCurrencyValue = inputCurrency.isNative ? ethers.BigNumber.from(trade.trade.maximumAmountIn(options.slippageTolerance).quotient.toString()) : ethers.BigNumber.from(0);
    trade.encode(planner, {
      allowRevert: false
    });
    return SwapRouter.encodePlan(planner, nativeCurrencyValue, {
      deadline: options.deadlineOrPreviousBlockhash ? ethers.BigNumber.from(options.deadlineOrPreviousBlockhash) : undefined
    });
  }
  /**
   * Encodes a planned route into a method name and parameters for the Router contract.
   * @param planner the planned route
   * @param nativeCurrencyValue the native currency value of the planned route
   * @param config the router config
   */;
  SwapRouter.encodePlan = function encodePlan(planner, nativeCurrencyValue, config) {
    if (config === void 0) {
      config = {};
    }
    var commands = planner.commands,
      inputs = planner.inputs;
    var functionSignature = !!config.deadline ? 'execute(bytes,bytes[],uint256)' : 'execute(bytes,bytes[])';
    var parameters = !!config.deadline ? [commands, inputs, config.deadline] : [commands, inputs];
    var calldata = SwapRouter.INTERFACE.encodeFunctionData(functionSignature, parameters);
    return {
      calldata: calldata,
      value: nativeCurrencyValue.toHexString()
    };
  };
  return SwapRouter;
}();
SwapRouter.INTERFACE = /*#__PURE__*/new abi$7.Interface(UniversalRouter_json.abi);

var CryptopunkTrade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(CryptopunkTrade, _NFTTrade);
  function CryptopunkTrade(orders) {
    return _NFTTrade.call(this, exports.Market.Cryptopunks, orders) || this;
  }
  var _proto = CryptopunkTrade.prototype;
  _proto.encode = function encode(planner, config) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var item = _step.value;
      planner.addCommand(CommandType.CRYPTOPUNKS, [item.tokenId, item.recipient, item.value], config.allowRevert);
    }
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator2 = _createForOfIteratorHelperLoose(this.orders), _step2; !(_step2 = _iterator2()).done;) {
      var item = _step2.value;
      buyItems.push({
        tokenAddress: CryptopunkTrade.CRYPTOPUNK_ADDRESS,
        tokenId: item.tokenId,
        tokenType: exports.TokenType.Cryptopunk
      });
    }
    return buyItems;
  };
  _proto.getTotalPrice = function getTotalPrice() {
    var total = ethers.BigNumber.from(0);
    for (var _iterator3 = _createForOfIteratorHelperLoose(this.orders), _step3; !(_step3 = _iterator3()).done;) {
      var item = _step3.value;
      total = total.add(item.value);
    }
    return total;
  };
  return CryptopunkTrade;
}(NFTTrade);
CryptopunkTrade.CRYPTOPUNK_ADDRESS = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';

var abi = [
	{
		inputs: [
			{
				internalType: "address payable",
				name: "treasury",
				type: "address"
			},
			{
				internalType: "address",
				name: "feth",
				type: "address"
			},
			{
				internalType: "address",
				name: "royaltyRegistry",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "duration",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		inputs: [
		],
		name: "FoundationTreasuryNode_Address_Is_Not_A_Contract",
		type: "error"
	},
	{
		inputs: [
		],
		name: "FoundationTreasuryNode_Caller_Not_Admin",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "buyPrice",
				type: "uint256"
			}
		],
		name: "NFTMarketBuyPrice_Cannot_Buy_At_Lower_Price",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketBuyPrice_Cannot_Buy_Unset_Price",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketBuyPrice_Cannot_Cancel_Unset_Price",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "NFTMarketBuyPrice_Only_Owner_Can_Cancel_Price",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "NFTMarketBuyPrice_Only_Owner_Can_Set_Price",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketBuyPrice_Price_Already_Set",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketBuyPrice_Price_Too_High",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "seller",
				type: "address"
			}
		],
		name: "NFTMarketBuyPrice_Seller_Mismatch",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketCore_FETH_Address_Is_Not_A_Contract",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketCore_Only_FETH_Can_Transfer_ETH",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketCore_Seller_Not_Found",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketFees_Address_Does_Not_Support_IRoyaltyRegistry",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketOffer_Cannot_Be_Made_While_In_Auction",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "currentOfferAmount",
				type: "uint256"
			}
		],
		name: "NFTMarketOffer_Offer_Below_Min_Amount",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "expiry",
				type: "uint256"
			}
		],
		name: "NFTMarketOffer_Offer_Expired",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "currentOfferFrom",
				type: "address"
			}
		],
		name: "NFTMarketOffer_Offer_From_Does_Not_Match",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "minOfferAmount",
				type: "uint256"
			}
		],
		name: "NFTMarketOffer_Offer_Must_Be_At_Least_Min_Amount",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketOffer_Provided_Contract_And_TokenId_Count_Must_Match",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketOffer_Reason_Required",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "NFTMarketReserveAuction_Already_Listed",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "minAmount",
				type: "uint256"
			}
		],
		name: "NFTMarketReserveAuction_Bid_Must_Be_At_Least_Min_Amount",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Cannot_Admin_Cancel_Without_Reason",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "reservePrice",
				type: "uint256"
			}
		],
		name: "NFTMarketReserveAuction_Cannot_Bid_Lower_Than_Reserve_Price",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "endTime",
				type: "uint256"
			}
		],
		name: "NFTMarketReserveAuction_Cannot_Bid_On_Ended_Auction",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Cannot_Bid_On_Nonexistent_Auction",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Cannot_Cancel_Nonexistent_Auction",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Cannot_Finalize_Already_Settled_Auction",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "endTime",
				type: "uint256"
			}
		],
		name: "NFTMarketReserveAuction_Cannot_Finalize_Auction_In_Progress",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Cannot_Rebid_Over_Outstanding_Bid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Cannot_Update_Auction_In_Progress",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "maxDuration",
				type: "uint256"
			}
		],
		name: "NFTMarketReserveAuction_Exceeds_Max_Duration",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "extensionDuration",
				type: "uint256"
			}
		],
		name: "NFTMarketReserveAuction_Less_Than_Extension_Duration",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Must_Set_Non_Zero_Reserve_Price",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "seller",
				type: "address"
			}
		],
		name: "NFTMarketReserveAuction_Not_Matching_Seller",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "NFTMarketReserveAuction_Only_Owner_Can_Update_Auction",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Price_Already_Set",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NFTMarketReserveAuction_Too_Much_Value_Provided",
		type: "error"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "seller",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "buyer",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "protocolFee",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "creatorFee",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "sellerRev",
				type: "uint256"
			}
		],
		name: "BuyPriceAccepted",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "BuyPriceCanceled",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "BuyPriceInvalidated",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "seller",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "price",
				type: "uint256"
			}
		],
		name: "BuyPriceSet",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "address",
				name: "buyReferrer",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "buyReferrerProtocolFee",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "buyReferrerSellerFee",
				type: "uint256"
			}
		],
		name: "BuyReferralPaid",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint8",
				name: "version",
				type: "uint8"
			}
		],
		name: "Initialized",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "buyer",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "seller",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "protocolFee",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "creatorFee",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "sellerRev",
				type: "uint256"
			}
		],
		name: "OfferAccepted",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "string",
				name: "reason",
				type: "string"
			}
		],
		name: "OfferCanceledByAdmin",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "OfferInvalidated",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "buyer",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "expiration",
				type: "uint256"
			}
		],
		name: "OfferMade",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "bidder",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "endTime",
				type: "uint256"
			}
		],
		name: "ReserveAuctionBidPlaced",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "ReserveAuctionCanceled",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "string",
				name: "reason",
				type: "string"
			}
		],
		name: "ReserveAuctionCanceledByAdmin",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "seller",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "duration",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "extensionDuration",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "reservePrice",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "ReserveAuctionCreated",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "seller",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "bidder",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "protocolFee",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "creatorFee",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "sellerRev",
				type: "uint256"
			}
		],
		name: "ReserveAuctionFinalized",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "ReserveAuctionInvalidated",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "reservePrice",
				type: "uint256"
			}
		],
		name: "ReserveAuctionUpdated",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "user",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "WithdrawalToFETH",
		type: "event"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "offerFrom",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "minAmount",
				type: "uint256"
			}
		],
		name: "acceptOffer",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address[]",
				name: "nftContracts",
				type: "address[]"
			},
			{
				internalType: "uint256[]",
				name: "tokenIds",
				type: "uint256[]"
			},
			{
				internalType: "string",
				name: "reason",
				type: "string"
			}
		],
		name: "adminCancelOffers",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			},
			{
				internalType: "string",
				name: "reason",
				type: "string"
			}
		],
		name: "adminCancelReserveAuction",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "maxPrice",
				type: "uint256"
			}
		],
		name: "buy",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "maxPrice",
				type: "uint256"
			},
			{
				internalType: "address payable",
				name: "referrer",
				type: "address"
			}
		],
		name: "buyV2",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "cancelBuyPrice",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "cancelReserveAuction",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reservePrice",
				type: "uint256"
			}
		],
		name: "createReserveAuction",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "finalizeReserveAuction",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "getBuyPrice",
		outputs: [
			{
				internalType: "address",
				name: "seller",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "price",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "price",
				type: "uint256"
			}
		],
		name: "getFeesAndRecipients",
		outputs: [
			{
				internalType: "uint256",
				name: "protocolFee",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "creatorRev",
				type: "uint256"
			},
			{
				internalType: "address payable[]",
				name: "creatorRecipients",
				type: "address[]"
			},
			{
				internalType: "uint256[]",
				name: "creatorShares",
				type: "uint256[]"
			},
			{
				internalType: "uint256",
				name: "sellerRev",
				type: "uint256"
			},
			{
				internalType: "address payable",
				name: "owner",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "getFethAddress",
		outputs: [
			{
				internalType: "address",
				name: "fethAddress",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "getFoundationTreasury",
		outputs: [
			{
				internalType: "address payable",
				name: "treasuryAddress",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "getImmutableRoyalties",
		outputs: [
			{
				internalType: "address payable[]",
				name: "recipients",
				type: "address[]"
			},
			{
				internalType: "uint256[]",
				name: "splitPerRecipientInBasisPoints",
				type: "uint256[]"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "getMinBidAmount",
		outputs: [
			{
				internalType: "uint256",
				name: "minimum",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "getMinOfferAmount",
		outputs: [
			{
				internalType: "uint256",
				name: "minimum",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "address payable",
				name: "creator",
				type: "address"
			}
		],
		name: "getMutableRoyalties",
		outputs: [
			{
				internalType: "address payable[]",
				name: "recipients",
				type: "address[]"
			},
			{
				internalType: "uint256[]",
				name: "splitPerRecipientInBasisPoints",
				type: "uint256[]"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "getOffer",
		outputs: [
			{
				internalType: "address",
				name: "buyer",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "expiration",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "getOfferReferrer",
		outputs: [
			{
				internalType: "address payable",
				name: "referrer",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "getReserveAuction",
		outputs: [
			{
				components: [
					{
						internalType: "address",
						name: "nftContract",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "tokenId",
						type: "uint256"
					},
					{
						internalType: "address payable",
						name: "seller",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "duration",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "extensionDuration",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "address payable",
						name: "bidder",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "amount",
						type: "uint256"
					}
				],
				internalType: "struct NFTMarketReserveAuction.ReserveAuction",
				name: "auction",
				type: "tuple"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "getReserveAuctionBidReferrer",
		outputs: [
			{
				internalType: "address payable",
				name: "referrer",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "getReserveAuctionIdFor",
		outputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "getRoyaltyRegistry",
		outputs: [
			{
				internalType: "address",
				name: "registry",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			}
		],
		name: "getTokenCreator",
		outputs: [
			{
				internalType: "address payable",
				name: "creator",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "initialize",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "makeOffer",
		outputs: [
			{
				internalType: "uint256",
				name: "expiration",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				internalType: "address payable",
				name: "referrer",
				type: "address"
			}
		],
		name: "makeOfferV2",
		outputs: [
			{
				internalType: "uint256",
				name: "expiration",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			}
		],
		name: "placeBid",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				internalType: "address payable",
				name: "referrer",
				type: "address"
			}
		],
		name: "placeBidV2",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "nftContract",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "price",
				type: "uint256"
			}
		],
		name: "setBuyPrice",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "auctionId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reservePrice",
				type: "uint256"
			}
		],
		name: "updateReserveAuction",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		stateMutability: "payable",
		type: "receive"
	}
];

var FoundationTrade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(FoundationTrade, _NFTTrade);
  function FoundationTrade(orders) {
    return _NFTTrade.call(this, exports.Market.Foundation, orders) || this;
  }
  var _proto = FoundationTrade.prototype;
  _proto.encode = function encode(planner, config) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var item = _step.value;
      var calldata = FoundationTrade.INTERFACE.encodeFunctionData('buyV2', [item.tokenAddress, item.tokenId, item.price, item.referrer]);
      planner.addCommand(CommandType.FOUNDATION, [item.price, calldata, item.recipient, item.tokenAddress, item.tokenId], config.allowRevert);
    }
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator2 = _createForOfIteratorHelperLoose(this.orders), _step2; !(_step2 = _iterator2()).done;) {
      var item = _step2.value;
      buyItems.push({
        tokenAddress: item.tokenAddress,
        tokenId: item.tokenId,
        tokenType: exports.TokenType.ERC721
      });
    }
    return buyItems;
  };
  _proto.getTotalPrice = function getTotalPrice() {
    var total = ethers.BigNumber.from(0);
    for (var _iterator3 = _createForOfIteratorHelperLoose(this.orders), _step3; !(_step3 = _iterator3()).done;) {
      var item = _step3.value;
      total = total.add(item.price);
    }
    return total;
  };
  return FoundationTrade;
}(NFTTrade);
FoundationTrade.INTERFACE = /*#__PURE__*/new abi$7.Interface(abi);

var abi$1 = [
	{
		inputs: [
			{
				internalType: "address",
				name: "_owner",
				type: "address"
			},
			{
				internalType: "address",
				name: "_protocolFeeRecipient",
				type: "address"
			},
			{
				internalType: "address",
				name: "_transferManager",
				type: "address"
			},
			{
				internalType: "address",
				name: "_weth",
				type: "address"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		inputs: [
		],
		name: "CallerInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "ChainIdInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "CreatorFeeBpTooHigh",
		type: "error"
	},
	{
		inputs: [
		],
		name: "CurrencyInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "ERC20TransferFromFail",
		type: "error"
	},
	{
		inputs: [
		],
		name: "LengthsInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "MerkleProofInvalid",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "length",
				type: "uint256"
			}
		],
		name: "MerkleProofTooLarge",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NewGasLimitETHTransferTooLow",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NewProtocolFeeRecipientCannotBeNullAddress",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NoOngoingTransferInProgress",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NoSelectorForStrategy",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NoncesInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NotAContract",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NotAffiliateController",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NotOwner",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NotV2Strategy",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NullSignerAddress",
		type: "error"
	},
	{
		inputs: [
		],
		name: "OutsideOfTimeRange",
		type: "error"
	},
	{
		inputs: [
		],
		name: "PercentageTooHigh",
		type: "error"
	},
	{
		inputs: [
		],
		name: "QuoteTypeInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "ReentrancyFail",
		type: "error"
	},
	{
		inputs: [
		],
		name: "RenouncementNotInProgress",
		type: "error"
	},
	{
		inputs: [
		],
		name: "SameDomainSeparator",
		type: "error"
	},
	{
		inputs: [
		],
		name: "SignatureEOAInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "SignatureERC1271Invalid",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "length",
				type: "uint256"
			}
		],
		name: "SignatureLengthInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "SignatureParameterSInvalid",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			}
		],
		name: "SignatureParameterVInvalid",
		type: "error"
	},
	{
		inputs: [
		],
		name: "StrategyHasNoSelector",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "strategyId",
				type: "uint256"
			}
		],
		name: "StrategyNotAvailable",
		type: "error"
	},
	{
		inputs: [
		],
		name: "StrategyNotUsed",
		type: "error"
	},
	{
		inputs: [
		],
		name: "StrategyProtocolFeeTooHigh",
		type: "error"
	},
	{
		inputs: [
		],
		name: "TransferAlreadyInProgress",
		type: "error"
	},
	{
		inputs: [
		],
		name: "TransferNotInProgress",
		type: "error"
	},
	{
		inputs: [
		],
		name: "WrongPotentialOwner",
		type: "error"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "affiliate",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "currency",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "affiliateFee",
				type: "uint256"
			}
		],
		name: "AffiliatePayment",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
		],
		name: "CancelOwnershipTransfer",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "currency",
				type: "address"
			},
			{
				indexed: false,
				internalType: "bool",
				name: "isAllowed",
				type: "bool"
			}
		],
		name: "CurrencyStatusUpdated",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
		],
		name: "InitiateOwnershipRenouncement",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "previousOwner",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "potentialOwner",
				type: "address"
			}
		],
		name: "InitiateOwnershipTransfer",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "affiliateController",
				type: "address"
			}
		],
		name: "NewAffiliateController",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "bool",
				name: "isActive",
				type: "bool"
			}
		],
		name: "NewAffiliateProgramStatus",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "affiliate",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "rate",
				type: "uint256"
			}
		],
		name: "NewAffiliateRate",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "user",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "bidNonce",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "askNonce",
				type: "uint256"
			}
		],
		name: "NewBidAskNonces",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "creatorFeeManager",
				type: "address"
			}
		],
		name: "NewCreatorFeeManager",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
		],
		name: "NewDomainSeparator",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "gasLimitETHTransfer",
				type: "uint256"
			}
		],
		name: "NewGasLimitETHTransfer",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "maxCreatorFeeBp",
				type: "uint256"
			}
		],
		name: "NewMaxCreatorFeeBp",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "newOwner",
				type: "address"
			}
		],
		name: "NewOwner",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "protocolFeeRecipient",
				type: "address"
			}
		],
		name: "NewProtocolFeeRecipient",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "strategyId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint16",
				name: "standardProtocolFeeBp",
				type: "uint16"
			},
			{
				indexed: false,
				internalType: "uint16",
				name: "minTotalFeeBp",
				type: "uint16"
			},
			{
				indexed: false,
				internalType: "uint16",
				name: "maxProtocolFeeBp",
				type: "uint16"
			},
			{
				indexed: false,
				internalType: "bytes4",
				name: "selector",
				type: "bytes4"
			},
			{
				indexed: false,
				internalType: "bool",
				name: "isMakerBid",
				type: "bool"
			},
			{
				indexed: false,
				internalType: "address",
				name: "implementation",
				type: "address"
			}
		],
		name: "NewStrategy",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "user",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "orderNonces",
				type: "uint256[]"
			}
		],
		name: "OrderNoncesCancelled",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "strategyId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "bool",
				name: "isActive",
				type: "bool"
			},
			{
				indexed: false,
				internalType: "uint16",
				name: "standardProtocolFeeBp",
				type: "uint16"
			},
			{
				indexed: false,
				internalType: "uint16",
				name: "minTotalFeeBp",
				type: "uint16"
			}
		],
		name: "StrategyUpdated",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "user",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "subsetNonces",
				type: "uint256[]"
			}
		],
		name: "SubsetNoncesCancelled",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				components: [
					{
						internalType: "bytes32",
						name: "orderHash",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "orderNonce",
						type: "uint256"
					},
					{
						internalType: "bool",
						name: "isNonceInvalidated",
						type: "bool"
					}
				],
				indexed: false,
				internalType: "struct ILooksRareProtocol.NonceInvalidationParameters",
				name: "nonceInvalidationParameters",
				type: "tuple"
			},
			{
				indexed: false,
				internalType: "address",
				name: "askUser",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "bidUser",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "strategyId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "address",
				name: "currency",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "collection",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "itemIds",
				type: "uint256[]"
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			},
			{
				indexed: false,
				internalType: "address[2]",
				name: "feeRecipients",
				type: "address[2]"
			},
			{
				indexed: false,
				internalType: "uint256[3]",
				name: "feeAmounts",
				type: "uint256[3]"
			}
		],
		name: "TakerAsk",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				components: [
					{
						internalType: "bytes32",
						name: "orderHash",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "orderNonce",
						type: "uint256"
					},
					{
						internalType: "bool",
						name: "isNonceInvalidated",
						type: "bool"
					}
				],
				indexed: false,
				internalType: "struct ILooksRareProtocol.NonceInvalidationParameters",
				name: "nonceInvalidationParameters",
				type: "tuple"
			},
			{
				indexed: false,
				internalType: "address",
				name: "bidUser",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "bidRecipient",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "strategyId",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "address",
				name: "currency",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "collection",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "itemIds",
				type: "uint256[]"
			},
			{
				indexed: false,
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			},
			{
				indexed: false,
				internalType: "address[2]",
				name: "feeRecipients",
				type: "address[2]"
			},
			{
				indexed: false,
				internalType: "uint256[3]",
				name: "feeAmounts",
				type: "uint256[3]"
			}
		],
		name: "TakerBid",
		type: "event"
	},
	{
		inputs: [
		],
		name: "MAGIC_VALUE_ORDER_NONCE_EXECUTED",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "WETH",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint16",
				name: "standardProtocolFeeBp",
				type: "uint16"
			},
			{
				internalType: "uint16",
				name: "minTotalFeeBp",
				type: "uint16"
			},
			{
				internalType: "uint16",
				name: "maxProtocolFeeBp",
				type: "uint16"
			},
			{
				internalType: "bytes4",
				name: "selector",
				type: "bytes4"
			},
			{
				internalType: "bool",
				name: "isMakerBid",
				type: "bool"
			},
			{
				internalType: "address",
				name: "implementation",
				type: "address"
			}
		],
		name: "addStrategy",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "affiliateController",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "affiliateRates",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256[]",
				name: "orderNonces",
				type: "uint256[]"
			}
		],
		name: "cancelOrderNonces",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "cancelOwnershipTransfer",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256[]",
				name: "subsetNonces",
				type: "uint256[]"
			}
		],
		name: "cancelSubsetNonces",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "chainId",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "confirmOwnershipRenouncement",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "confirmOwnershipTransfer",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "creatorFeeManager",
		outputs: [
			{
				internalType: "contract ICreatorFeeManager",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "domainSeparator",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "recipient",
						type: "address"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Taker[]",
				name: "takerBids",
				type: "tuple[]"
			},
			{
				components: [
					{
						internalType: "enum QuoteType",
						name: "quoteType",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "globalNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "subsetNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "orderNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "strategyId",
						type: "uint256"
					},
					{
						internalType: "enum CollectionType",
						name: "collectionType",
						type: "uint8"
					},
					{
						internalType: "address",
						name: "collection",
						type: "address"
					},
					{
						internalType: "address",
						name: "currency",
						type: "address"
					},
					{
						internalType: "address",
						name: "signer",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "startTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "price",
						type: "uint256"
					},
					{
						internalType: "uint256[]",
						name: "itemIds",
						type: "uint256[]"
					},
					{
						internalType: "uint256[]",
						name: "amounts",
						type: "uint256[]"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Maker[]",
				name: "makerAsks",
				type: "tuple[]"
			},
			{
				internalType: "bytes[]",
				name: "makerSignatures",
				type: "bytes[]"
			},
			{
				components: [
					{
						internalType: "bytes32",
						name: "root",
						type: "bytes32"
					},
					{
						components: [
							{
								internalType: "bytes32",
								name: "value",
								type: "bytes32"
							},
							{
								internalType: "enum OrderStructs.MerkleTreeNodePosition",
								name: "position",
								type: "uint8"
							}
						],
						internalType: "struct OrderStructs.MerkleTreeNode[]",
						name: "proof",
						type: "tuple[]"
					}
				],
				internalType: "struct OrderStructs.MerkleTree[]",
				name: "merkleTrees",
				type: "tuple[]"
			},
			{
				internalType: "address",
				name: "affiliate",
				type: "address"
			},
			{
				internalType: "bool",
				name: "isAtomic",
				type: "bool"
			}
		],
		name: "executeMultipleTakerBids",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "recipient",
						type: "address"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Taker",
				name: "takerAsk",
				type: "tuple"
			},
			{
				components: [
					{
						internalType: "enum QuoteType",
						name: "quoteType",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "globalNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "subsetNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "orderNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "strategyId",
						type: "uint256"
					},
					{
						internalType: "enum CollectionType",
						name: "collectionType",
						type: "uint8"
					},
					{
						internalType: "address",
						name: "collection",
						type: "address"
					},
					{
						internalType: "address",
						name: "currency",
						type: "address"
					},
					{
						internalType: "address",
						name: "signer",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "startTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "price",
						type: "uint256"
					},
					{
						internalType: "uint256[]",
						name: "itemIds",
						type: "uint256[]"
					},
					{
						internalType: "uint256[]",
						name: "amounts",
						type: "uint256[]"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Maker",
				name: "makerBid",
				type: "tuple"
			},
			{
				internalType: "bytes",
				name: "makerSignature",
				type: "bytes"
			},
			{
				components: [
					{
						internalType: "bytes32",
						name: "root",
						type: "bytes32"
					},
					{
						components: [
							{
								internalType: "bytes32",
								name: "value",
								type: "bytes32"
							},
							{
								internalType: "enum OrderStructs.MerkleTreeNodePosition",
								name: "position",
								type: "uint8"
							}
						],
						internalType: "struct OrderStructs.MerkleTreeNode[]",
						name: "proof",
						type: "tuple[]"
					}
				],
				internalType: "struct OrderStructs.MerkleTree",
				name: "merkleTree",
				type: "tuple"
			},
			{
				internalType: "address",
				name: "affiliate",
				type: "address"
			}
		],
		name: "executeTakerAsk",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "recipient",
						type: "address"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Taker",
				name: "takerBid",
				type: "tuple"
			},
			{
				components: [
					{
						internalType: "enum QuoteType",
						name: "quoteType",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "globalNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "subsetNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "orderNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "strategyId",
						type: "uint256"
					},
					{
						internalType: "enum CollectionType",
						name: "collectionType",
						type: "uint8"
					},
					{
						internalType: "address",
						name: "collection",
						type: "address"
					},
					{
						internalType: "address",
						name: "currency",
						type: "address"
					},
					{
						internalType: "address",
						name: "signer",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "startTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "price",
						type: "uint256"
					},
					{
						internalType: "uint256[]",
						name: "itemIds",
						type: "uint256[]"
					},
					{
						internalType: "uint256[]",
						name: "amounts",
						type: "uint256[]"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Maker",
				name: "makerAsk",
				type: "tuple"
			},
			{
				internalType: "bytes",
				name: "makerSignature",
				type: "bytes"
			},
			{
				components: [
					{
						internalType: "bytes32",
						name: "root",
						type: "bytes32"
					},
					{
						components: [
							{
								internalType: "bytes32",
								name: "value",
								type: "bytes32"
							},
							{
								internalType: "enum OrderStructs.MerkleTreeNodePosition",
								name: "position",
								type: "uint8"
							}
						],
						internalType: "struct OrderStructs.MerkleTreeNode[]",
						name: "proof",
						type: "tuple[]"
					}
				],
				internalType: "struct OrderStructs.MerkleTree",
				name: "merkleTree",
				type: "tuple"
			},
			{
				internalType: "address",
				name: "affiliate",
				type: "address"
			}
		],
		name: "executeTakerBid",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "root",
				type: "bytes32"
			},
			{
				internalType: "uint256",
				name: "proofLength",
				type: "uint256"
			}
		],
		name: "hashBatchOrder",
		outputs: [
			{
				internalType: "bytes32",
				name: "batchOrderHash",
				type: "bytes32"
			}
		],
		stateMutability: "pure",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bool",
				name: "bid",
				type: "bool"
			},
			{
				internalType: "bool",
				name: "ask",
				type: "bool"
			}
		],
		name: "incrementBidAskNonces",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "initiateOwnershipRenouncement",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newPotentialOwner",
				type: "address"
			}
		],
		name: "initiateOwnershipTransfer",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "isAffiliateProgramActive",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "isCurrencyAllowed",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "maxCreatorFeeBp",
		outputs: [
			{
				internalType: "uint16",
				name: "",
				type: "uint16"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "ownershipStatus",
		outputs: [
			{
				internalType: "enum IOwnableTwoSteps.Status",
				name: "",
				type: "uint8"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "potentialOwner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "protocolFeeRecipient",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "recipient",
						type: "address"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Taker",
				name: "takerBid",
				type: "tuple"
			},
			{
				components: [
					{
						internalType: "enum QuoteType",
						name: "quoteType",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "globalNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "subsetNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "orderNonce",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "strategyId",
						type: "uint256"
					},
					{
						internalType: "enum CollectionType",
						name: "collectionType",
						type: "uint8"
					},
					{
						internalType: "address",
						name: "collection",
						type: "address"
					},
					{
						internalType: "address",
						name: "currency",
						type: "address"
					},
					{
						internalType: "address",
						name: "signer",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "startTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "price",
						type: "uint256"
					},
					{
						internalType: "uint256[]",
						name: "itemIds",
						type: "uint256[]"
					},
					{
						internalType: "uint256[]",
						name: "amounts",
						type: "uint256[]"
					},
					{
						internalType: "bytes",
						name: "additionalParameters",
						type: "bytes"
					}
				],
				internalType: "struct OrderStructs.Maker",
				name: "makerAsk",
				type: "tuple"
			},
			{
				internalType: "address",
				name: "sender",
				type: "address"
			},
			{
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			}
		],
		name: "restrictedExecuteTakerBid",
		outputs: [
			{
				internalType: "uint256",
				name: "protocolFeeAmount",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		name: "strategyInfo",
		outputs: [
			{
				internalType: "bool",
				name: "isActive",
				type: "bool"
			},
			{
				internalType: "uint16",
				name: "standardProtocolFeeBp",
				type: "uint16"
			},
			{
				internalType: "uint16",
				name: "minTotalFeeBp",
				type: "uint16"
			},
			{
				internalType: "uint16",
				name: "maxProtocolFeeBp",
				type: "uint16"
			},
			{
				internalType: "bytes4",
				name: "selector",
				type: "bytes4"
			},
			{
				internalType: "bool",
				name: "isMakerBid",
				type: "bool"
			},
			{
				internalType: "address",
				name: "implementation",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "transferManager",
		outputs: [
			{
				internalType: "contract TransferManager",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newAffiliateController",
				type: "address"
			}
		],
		name: "updateAffiliateController",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bool",
				name: "isActive",
				type: "bool"
			}
		],
		name: "updateAffiliateProgramStatus",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "affiliate",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "bp",
				type: "uint256"
			}
		],
		name: "updateAffiliateRate",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newCreatorFeeManager",
				type: "address"
			}
		],
		name: "updateCreatorFeeManager",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "currency",
				type: "address"
			},
			{
				internalType: "bool",
				name: "isAllowed",
				type: "bool"
			}
		],
		name: "updateCurrencyStatus",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "updateDomainSeparator",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "newGasLimitETHTransfer",
				type: "uint256"
			}
		],
		name: "updateETHGasLimitForTransfer",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint16",
				name: "newMaxCreatorFeeBp",
				type: "uint16"
			}
		],
		name: "updateMaxCreatorFeeBp",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newProtocolFeeRecipient",
				type: "address"
			}
		],
		name: "updateProtocolFeeRecipient",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "strategyId",
				type: "uint256"
			},
			{
				internalType: "bool",
				name: "isActive",
				type: "bool"
			},
			{
				internalType: "uint16",
				name: "newStandardProtocolFee",
				type: "uint16"
			},
			{
				internalType: "uint16",
				name: "newMinTotalFee",
				type: "uint16"
			}
		],
		name: "updateStrategy",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "userBidAskNonces",
		outputs: [
			{
				internalType: "uint256",
				name: "bidNonce",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "askNonce",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		name: "userOrderNonce",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		name: "userSubsetNonce",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	}
];

var LooksRareV2Trade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(LooksRareV2Trade, _NFTTrade);
  function LooksRareV2Trade(orders) {
    return _NFTTrade.call(this, exports.Market.LooksRareV2, orders) || this;
  }
  var _proto = LooksRareV2Trade.prototype;
  _proto.encode = function encode(planner, config) {
    var _this$refactorAPIData = this.refactorAPIData(this.orders),
      takerBids = _this$refactorAPIData.takerBids,
      makerOrders = _this$refactorAPIData.makerOrders,
      makerSignatures = _this$refactorAPIData.makerSignatures,
      totalValue = _this$refactorAPIData.totalValue,
      merkleTrees = _this$refactorAPIData.merkleTrees;
    var calldata;
    if (this.orders.length == 1) {
      calldata = LooksRareV2Trade.INTERFACE.encodeFunctionData('executeTakerBid', [takerBids[0], makerOrders[0], makerSignatures[0], merkleTrees[0], ZERO_ADDRESS]);
    } else {
      calldata = LooksRareV2Trade.INTERFACE.encodeFunctionData('executeMultipleTakerBids', [takerBids, makerOrders, makerSignatures, merkleTrees, ZERO_ADDRESS, false]);
    }
    planner.addCommand(CommandType.LOOKS_RARE_V2, [totalValue, calldata], config.allowRevert);
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var item = _step.value;
      var tokenAddress = item.apiOrder.collection;
      var tokenType = item.apiOrder.collectionType == LooksRareV2Trade.ERC721_ORDER ? exports.TokenType.ERC721 : exports.TokenType.ERC1155;
      for (var _iterator2 = _createForOfIteratorHelperLoose(item.apiOrder.itemIds), _step2; !(_step2 = _iterator2()).done;) {
        var tokenId = _step2.value;
        buyItems.push({
          tokenAddress: tokenAddress,
          tokenId: tokenId,
          tokenType: tokenType
        });
      }
    }
    return buyItems;
  };
  _proto.getTotalPrice = function getTotalPrice() {
    var total = ethers.BigNumber.from(0);
    for (var _iterator3 = _createForOfIteratorHelperLoose(this.orders), _step3; !(_step3 = _iterator3()).done;) {
      var item = _step3.value;
      total = total.add(item.apiOrder.price);
    }
    return total;
  };
  _proto.refactorAPIData = function refactorAPIData(orders) {
    var takerBids = [];
    var makerOrders = [];
    var makerSignatures = [];
    var totalValue = ethers.BigNumber.from(0);
    var merkleTrees = [];
    orders.forEach(function (order) {
      var _order$apiOrder$merkl, _order$apiOrder$merkl2;
      makerOrders.push(_extends({}, order.apiOrder));
      makerSignatures.push(order.apiOrder.signature);
      takerBids.push({
        recipient: order.taker,
        additionalParameters: '0x'
      });
      totalValue = totalValue.add(ethers.BigNumber.from(order.apiOrder.price));
      merkleTrees.push({
        root: (_order$apiOrder$merkl = order.apiOrder.merkleRoot) != null ? _order$apiOrder$merkl : '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: (_order$apiOrder$merkl2 = order.apiOrder.merkleProof) != null ? _order$apiOrder$merkl2 : []
      });
    });
    return {
      takerBids: takerBids,
      makerOrders: makerOrders,
      makerSignatures: makerSignatures,
      totalValue: totalValue,
      merkleTrees: merkleTrees
    };
  };
  return LooksRareV2Trade;
}(NFTTrade);
LooksRareV2Trade.INTERFACE = /*#__PURE__*/new abi$7.Interface(abi$1);
LooksRareV2Trade.ERC721_ORDER = 0;

var abi$2 = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address"
			}
		],
		name: "OwnershipTransferred",
		type: "event"
	},
	{
		inputs: [
		],
		name: "ETH",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "NFT20",
		outputs: [
			{
				internalType: "contract INFT20Factory",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "UNIV2",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "UNIV3",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "WETH",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "_nft",
				type: "address"
			},
			{
				internalType: "uint256[]",
				name: "_toIds",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "_toAmounts",
				type: "uint256[]"
			},
			{
				internalType: "address",
				name: "_receipient",
				type: "address"
			},
			{
				internalType: "uint24",
				name: "_fee",
				type: "uint24"
			},
			{
				internalType: "bool",
				name: "isV3",
				type: "bool"
			}
		],
		name: "ethForNft",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "_nft",
				type: "address"
			},
			{
				internalType: "uint256[]",
				name: "_ids",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "_amounts",
				type: "uint256[]"
			},
			{
				internalType: "bool",
				name: "isErc721",
				type: "bool"
			},
			{
				internalType: "uint24",
				name: "_fee",
				type: "uint24"
			},
			{
				internalType: "bool",
				name: "isV3",
				type: "bool"
			}
		],
		name: "nftForEth",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "tokenAddress",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "tokenAmount",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "sendTo",
				type: "address"
			}
		],
		name: "recoverERC20",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "renounceOwnership",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "_registry",
				type: "address"
			}
		],
		name: "setNFT20",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newOwner",
				type: "address"
			}
		],
		name: "transferOwnership",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "withdrawEth",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		stateMutability: "payable",
		type: "receive"
	}
];

var NFT20Trade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(NFT20Trade, _NFTTrade);
  function NFT20Trade(orders) {
    return _NFTTrade.call(this, exports.Market.NFT20, orders) || this;
  }
  var _proto = NFT20Trade.prototype;
  _proto.encode = function encode(planner, config) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var order = _step.value;
      var calldata = NFT20Trade.INTERFACE.encodeFunctionData('ethForNft', [order.tokenAddress, order.tokenIds, order.tokenAmounts, order.recipient, order.fee, order.isV3]);
      planner.addCommand(CommandType.NFT20, [order.value, calldata], config.allowRevert);
    }
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator2 = _createForOfIteratorHelperLoose(this.orders), _step2; !(_step2 = _iterator2()).done;) {
      var pool = _step2.value;
      for (var _iterator3 = _createForOfIteratorHelperLoose(pool.tokenIds), _step3; !(_step3 = _iterator3()).done;) {
        var tokenId = _step3.value;
        buyItems.push({
          tokenAddress: pool.tokenAddress,
          tokenId: tokenId,
          tokenType: exports.TokenType.ERC721
        });
      }
    }
    return buyItems;
  };
  _proto.getTotalPrice = function getTotalPrice() {
    var total = ethers.BigNumber.from(0);
    for (var _iterator4 = _createForOfIteratorHelperLoose(this.orders), _step4; !(_step4 = _iterator4()).done;) {
      var item = _step4.value;
      total = total.add(item.value);
    }
    return total;
  };
  return NFT20Trade;
}(NFTTrade);
NFT20Trade.INTERFACE = /*#__PURE__*/new abi$7.Interface(abi$2);

var abi$3 = [
	{
		inputs: [
			{
				internalType: "address",
				name: "_nftxFactory",
				type: "address"
			},
			{
				internalType: "address",
				name: "_WETH",
				type: "address"
			},
			{
				internalType: "address payable",
				name: "_swapTarget",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "_dustThreshold",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "count",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "ethSpent",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "Buy",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "ethAmount",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "vTokenAmount",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "DustReturned",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address"
			}
		],
		name: "OwnershipTransferred",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "count",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "ethReceived",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "Sell",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "count",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "ethSpent",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "Swap",
		type: "event"
	},
	{
		inputs: [
		],
		name: "WETH",
		outputs: [
			{
				internalType: "contract IWETH",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "vaultId",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				internalType: "uint256[]",
				name: "specificIds",
				type: "uint256[]"
			},
			{
				internalType: "bytes",
				name: "swapCallData",
				type: "bytes"
			},
			{
				internalType: "address payable",
				name: "to",
				type: "address"
			}
		],
		name: "buyAndRedeem",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "vaultId",
				type: "uint256"
			},
			{
				internalType: "uint256[]",
				name: "idsIn",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "specificIds",
				type: "uint256[]"
			},
			{
				internalType: "bytes",
				name: "swapCallData",
				type: "bytes"
			},
			{
				internalType: "address payable",
				name: "to",
				type: "address"
			}
		],
		name: "buyAndSwap1155",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "vaultId",
				type: "uint256"
			},
			{
				internalType: "uint256[]",
				name: "idsIn",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "specificIds",
				type: "uint256[]"
			},
			{
				internalType: "bytes",
				name: "swapCallData",
				type: "bytes"
			},
			{
				internalType: "address payable",
				name: "to",
				type: "address"
			}
		],
		name: "buyAndSwap721",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "dustThreshold",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "feeDistributor",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "vaultId",
				type: "uint256"
			},
			{
				internalType: "uint256[]",
				name: "ids",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			},
			{
				internalType: "bytes",
				name: "swapCallData",
				type: "bytes"
			},
			{
				internalType: "address payable",
				name: "to",
				type: "address"
			}
		],
		name: "mintAndSell1155",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "vaultId",
				type: "uint256"
			},
			{
				internalType: "uint256[]",
				name: "ids",
				type: "uint256[]"
			},
			{
				internalType: "bytes",
				name: "swapCallData",
				type: "bytes"
			},
			{
				internalType: "address payable",
				name: "to",
				type: "address"
			}
		],
		name: "mintAndSell721",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "nftxFactory",
		outputs: [
			{
				internalType: "contract INFTXVaultFactory",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		name: "nftxVaultAddresses",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "uint256[]",
				name: "",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "",
				type: "uint256[]"
			},
			{
				internalType: "bytes",
				name: "",
				type: "bytes"
			}
		],
		name: "onERC1155BatchReceived",
		outputs: [
			{
				internalType: "bytes4",
				name: "",
				type: "bytes4"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			},
			{
				internalType: "bytes",
				name: "",
				type: "bytes"
			}
		],
		name: "onERC1155Received",
		outputs: [
			{
				internalType: "bytes4",
				name: "",
				type: "bytes4"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			},
			{
				internalType: "bytes",
				name: "",
				type: "bytes"
			}
		],
		name: "onERC721Received",
		outputs: [
			{
				internalType: "bytes4",
				name: "",
				type: "bytes4"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bool",
				name: "_paused",
				type: "bool"
			}
		],
		name: "pause",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "paused",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "renounceOwnership",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			}
		],
		name: "rescue",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "_dustThreshold",
				type: "uint256"
			}
		],
		name: "setDustThreshold",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes4",
				name: "interfaceId",
				type: "bytes4"
			}
		],
		name: "supportsInterface",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newOwner",
				type: "address"
			}
		],
		name: "transferOwnership",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		stateMutability: "payable",
		type: "receive"
	}
];

var NFTXTrade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(NFTXTrade, _NFTTrade);
  function NFTXTrade(orders) {
    return _NFTTrade.call(this, exports.Market.NFTX, orders) || this;
  }
  var _proto = NFTXTrade.prototype;
  _proto.encode = function encode(planner, config) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var order = _step.value;
      var calldata = NFTXTrade.INTERFACE.encodeFunctionData('buyAndRedeem', [order.vaultId, order.tokenIds.length, order.tokenIds, order.swapCalldata, order.recipient]);
      planner.addCommand(CommandType.NFTX, [order.value, calldata], config.allowRevert);
    }
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator2 = _createForOfIteratorHelperLoose(this.orders), _step2; !(_step2 = _iterator2()).done;) {
      var order = _step2.value;
      for (var _iterator3 = _createForOfIteratorHelperLoose(order.tokenIds), _step3; !(_step3 = _iterator3()).done;) {
        var tokenId = _step3.value;
        buyItems.push({
          tokenAddress: order.tokenAddress,
          tokenId: tokenId,
          tokenType: exports.TokenType.ERC721
        });
      }
    }
    return buyItems;
  };
  _proto.getTotalPrice = function getTotalPrice() {
    var total = ethers.BigNumber.from(0);
    for (var _iterator4 = _createForOfIteratorHelperLoose(this.orders), _step4; !(_step4 = _iterator4()).done;) {
      var item = _step4.value;
      total = total.add(item.value);
    }
    return total;
  };
  return NFTXTrade;
}(NFTTrade);
NFTXTrade.INTERFACE = /*#__PURE__*/new abi$7.Interface(abi$3);

var abi$4 = [
	{
		inputs: [
			{
				internalType: "address",
				name: "conduitController",
				type: "address"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		inputs: [
		],
		name: "BadContractSignature",
		type: "error"
	},
	{
		inputs: [
		],
		name: "BadFraction",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "BadReturnValueFromERC20OnTransfer",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			}
		],
		name: "BadSignatureV",
		type: "error"
	},
	{
		inputs: [
		],
		name: "ConsiderationCriteriaResolverOutOfRange",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "orderIndex",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "considerationIndex",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "shortfallAmount",
				type: "uint256"
			}
		],
		name: "ConsiderationNotMet",
		type: "error"
	},
	{
		inputs: [
		],
		name: "CriteriaNotEnabledForItem",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256[]",
				name: "identifiers",
				type: "uint256[]"
			},
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		name: "ERC1155BatchTransferGenericFailure",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "EtherTransferGenericFailure",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InexactFraction",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InsufficientEtherSupplied",
		type: "error"
	},
	{
		inputs: [
		],
		name: "Invalid1155BatchTransferEncoding",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidBasicOrderParameterEncoding",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "conduit",
				type: "address"
			}
		],
		name: "InvalidCallToConduit",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidCanceller",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "conduitKey",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "conduit",
				type: "address"
			}
		],
		name: "InvalidConduit",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidERC721TransferAmount",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidFulfillmentComponentData",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "InvalidMsgValue",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidNativeOfferItem",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidProof",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			}
		],
		name: "InvalidRestrictedOrder",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidSignature",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidSigner",
		type: "error"
	},
	{
		inputs: [
		],
		name: "InvalidTime",
		type: "error"
	},
	{
		inputs: [
		],
		name: "MismatchedFulfillmentOfferAndConsiderationComponents",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "enum Side",
				name: "side",
				type: "uint8"
			}
		],
		name: "MissingFulfillmentComponentOnAggregation",
		type: "error"
	},
	{
		inputs: [
		],
		name: "MissingItemAmount",
		type: "error"
	},
	{
		inputs: [
		],
		name: "MissingOriginalConsiderationItems",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address"
			}
		],
		name: "NoContract",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NoReentrantCalls",
		type: "error"
	},
	{
		inputs: [
		],
		name: "NoSpecifiedOrdersAvailable",
		type: "error"
	},
	{
		inputs: [
		],
		name: "OfferAndConsiderationRequiredOnFulfillment",
		type: "error"
	},
	{
		inputs: [
		],
		name: "OfferCriteriaResolverOutOfRange",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			}
		],
		name: "OrderAlreadyFilled",
		type: "error"
	},
	{
		inputs: [
		],
		name: "OrderCriteriaResolverOutOfRange",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			}
		],
		name: "OrderIsCancelled",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			}
		],
		name: "OrderPartiallyFilled",
		type: "error"
	},
	{
		inputs: [
		],
		name: "PartialFillsNotEnabledForOrder",
		type: "error"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "identifier",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "TokenTransferGenericFailure",
		type: "error"
	},
	{
		inputs: [
		],
		name: "UnresolvedConsiderationCriteria",
		type: "error"
	},
	{
		inputs: [
		],
		name: "UnresolvedOfferCriteria",
		type: "error"
	},
	{
		inputs: [
		],
		name: "UnusedItemParameters",
		type: "error"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "newCounter",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "offerer",
				type: "address"
			}
		],
		name: "CounterIncremented",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "address",
				name: "offerer",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "zone",
				type: "address"
			}
		],
		name: "OrderCancelled",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "address",
				name: "offerer",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "zone",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "recipient",
				type: "address"
			},
			{
				components: [
					{
						internalType: "enum ItemType",
						name: "itemType",
						type: "uint8"
					},
					{
						internalType: "address",
						name: "token",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "identifier",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "amount",
						type: "uint256"
					}
				],
				indexed: false,
				internalType: "struct SpentItem[]",
				name: "offer",
				type: "tuple[]"
			},
			{
				components: [
					{
						internalType: "enum ItemType",
						name: "itemType",
						type: "uint8"
					},
					{
						internalType: "address",
						name: "token",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "identifier",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "amount",
						type: "uint256"
					},
					{
						internalType: "address payable",
						name: "recipient",
						type: "address"
					}
				],
				indexed: false,
				internalType: "struct ReceivedItem[]",
				name: "consideration",
				type: "tuple[]"
			}
		],
		name: "OrderFulfilled",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "address",
				name: "offerer",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "zone",
				type: "address"
			}
		],
		name: "OrderValidated",
		type: "event"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "offerer",
						type: "address"
					},
					{
						internalType: "address",
						name: "zone",
						type: "address"
					},
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifierOrCriteria",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "startAmount",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endAmount",
								type: "uint256"
							}
						],
						internalType: "struct OfferItem[]",
						name: "offer",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifierOrCriteria",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "startAmount",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endAmount",
								type: "uint256"
							},
							{
								internalType: "address payable",
								name: "recipient",
								type: "address"
							}
						],
						internalType: "struct ConsiderationItem[]",
						name: "consideration",
						type: "tuple[]"
					},
					{
						internalType: "enum OrderType",
						name: "orderType",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "startTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "zoneHash",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "salt",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "conduitKey",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "counter",
						type: "uint256"
					}
				],
				internalType: "struct OrderComponents[]",
				name: "orders",
				type: "tuple[]"
			}
		],
		name: "cancel",
		outputs: [
			{
				internalType: "bool",
				name: "cancelled",
				type: "bool"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "offerer",
								type: "address"
							},
							{
								internalType: "address",
								name: "zone",
								type: "address"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									}
								],
								internalType: "struct OfferItem[]",
								name: "offer",
								type: "tuple[]"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									},
									{
										internalType: "address payable",
										name: "recipient",
										type: "address"
									}
								],
								internalType: "struct ConsiderationItem[]",
								name: "consideration",
								type: "tuple[]"
							},
							{
								internalType: "enum OrderType",
								name: "orderType",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "startTime",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endTime",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "zoneHash",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "conduitKey",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "totalOriginalConsiderationItems",
								type: "uint256"
							}
						],
						internalType: "struct OrderParameters",
						name: "parameters",
						type: "tuple"
					},
					{
						internalType: "uint120",
						name: "numerator",
						type: "uint120"
					},
					{
						internalType: "uint120",
						name: "denominator",
						type: "uint120"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					},
					{
						internalType: "bytes",
						name: "extraData",
						type: "bytes"
					}
				],
				internalType: "struct AdvancedOrder",
				name: "advancedOrder",
				type: "tuple"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "orderIndex",
						type: "uint256"
					},
					{
						internalType: "enum Side",
						name: "side",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "index",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "identifier",
						type: "uint256"
					},
					{
						internalType: "bytes32[]",
						name: "criteriaProof",
						type: "bytes32[]"
					}
				],
				internalType: "struct CriteriaResolver[]",
				name: "criteriaResolvers",
				type: "tuple[]"
			},
			{
				internalType: "bytes32",
				name: "fulfillerConduitKey",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "recipient",
				type: "address"
			}
		],
		name: "fulfillAdvancedOrder",
		outputs: [
			{
				internalType: "bool",
				name: "fulfilled",
				type: "bool"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "offerer",
								type: "address"
							},
							{
								internalType: "address",
								name: "zone",
								type: "address"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									}
								],
								internalType: "struct OfferItem[]",
								name: "offer",
								type: "tuple[]"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									},
									{
										internalType: "address payable",
										name: "recipient",
										type: "address"
									}
								],
								internalType: "struct ConsiderationItem[]",
								name: "consideration",
								type: "tuple[]"
							},
							{
								internalType: "enum OrderType",
								name: "orderType",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "startTime",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endTime",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "zoneHash",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "conduitKey",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "totalOriginalConsiderationItems",
								type: "uint256"
							}
						],
						internalType: "struct OrderParameters",
						name: "parameters",
						type: "tuple"
					},
					{
						internalType: "uint120",
						name: "numerator",
						type: "uint120"
					},
					{
						internalType: "uint120",
						name: "denominator",
						type: "uint120"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					},
					{
						internalType: "bytes",
						name: "extraData",
						type: "bytes"
					}
				],
				internalType: "struct AdvancedOrder[]",
				name: "advancedOrders",
				type: "tuple[]"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "orderIndex",
						type: "uint256"
					},
					{
						internalType: "enum Side",
						name: "side",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "index",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "identifier",
						type: "uint256"
					},
					{
						internalType: "bytes32[]",
						name: "criteriaProof",
						type: "bytes32[]"
					}
				],
				internalType: "struct CriteriaResolver[]",
				name: "criteriaResolvers",
				type: "tuple[]"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "orderIndex",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "itemIndex",
						type: "uint256"
					}
				],
				internalType: "struct FulfillmentComponent[][]",
				name: "offerFulfillments",
				type: "tuple[][]"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "orderIndex",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "itemIndex",
						type: "uint256"
					}
				],
				internalType: "struct FulfillmentComponent[][]",
				name: "considerationFulfillments",
				type: "tuple[][]"
			},
			{
				internalType: "bytes32",
				name: "fulfillerConduitKey",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "recipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "maximumFulfilled",
				type: "uint256"
			}
		],
		name: "fulfillAvailableAdvancedOrders",
		outputs: [
			{
				internalType: "bool[]",
				name: "availableOrders",
				type: "bool[]"
			},
			{
				components: [
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifier",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "amount",
								type: "uint256"
							},
							{
								internalType: "address payable",
								name: "recipient",
								type: "address"
							}
						],
						internalType: "struct ReceivedItem",
						name: "item",
						type: "tuple"
					},
					{
						internalType: "address",
						name: "offerer",
						type: "address"
					},
					{
						internalType: "bytes32",
						name: "conduitKey",
						type: "bytes32"
					}
				],
				internalType: "struct Execution[]",
				name: "executions",
				type: "tuple[]"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "offerer",
								type: "address"
							},
							{
								internalType: "address",
								name: "zone",
								type: "address"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									}
								],
								internalType: "struct OfferItem[]",
								name: "offer",
								type: "tuple[]"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									},
									{
										internalType: "address payable",
										name: "recipient",
										type: "address"
									}
								],
								internalType: "struct ConsiderationItem[]",
								name: "consideration",
								type: "tuple[]"
							},
							{
								internalType: "enum OrderType",
								name: "orderType",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "startTime",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endTime",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "zoneHash",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "conduitKey",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "totalOriginalConsiderationItems",
								type: "uint256"
							}
						],
						internalType: "struct OrderParameters",
						name: "parameters",
						type: "tuple"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					}
				],
				internalType: "struct Order[]",
				name: "orders",
				type: "tuple[]"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "orderIndex",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "itemIndex",
						type: "uint256"
					}
				],
				internalType: "struct FulfillmentComponent[][]",
				name: "offerFulfillments",
				type: "tuple[][]"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "orderIndex",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "itemIndex",
						type: "uint256"
					}
				],
				internalType: "struct FulfillmentComponent[][]",
				name: "considerationFulfillments",
				type: "tuple[][]"
			},
			{
				internalType: "bytes32",
				name: "fulfillerConduitKey",
				type: "bytes32"
			},
			{
				internalType: "uint256",
				name: "maximumFulfilled",
				type: "uint256"
			}
		],
		name: "fulfillAvailableOrders",
		outputs: [
			{
				internalType: "bool[]",
				name: "availableOrders",
				type: "bool[]"
			},
			{
				components: [
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifier",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "amount",
								type: "uint256"
							},
							{
								internalType: "address payable",
								name: "recipient",
								type: "address"
							}
						],
						internalType: "struct ReceivedItem",
						name: "item",
						type: "tuple"
					},
					{
						internalType: "address",
						name: "offerer",
						type: "address"
					},
					{
						internalType: "bytes32",
						name: "conduitKey",
						type: "bytes32"
					}
				],
				internalType: "struct Execution[]",
				name: "executions",
				type: "tuple[]"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "considerationToken",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "considerationIdentifier",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "considerationAmount",
						type: "uint256"
					},
					{
						internalType: "address payable",
						name: "offerer",
						type: "address"
					},
					{
						internalType: "address",
						name: "zone",
						type: "address"
					},
					{
						internalType: "address",
						name: "offerToken",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "offerIdentifier",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "offerAmount",
						type: "uint256"
					},
					{
						internalType: "enum BasicOrderType",
						name: "basicOrderType",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "startTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "zoneHash",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "salt",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "offererConduitKey",
						type: "bytes32"
					},
					{
						internalType: "bytes32",
						name: "fulfillerConduitKey",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "totalOriginalAdditionalRecipients",
						type: "uint256"
					},
					{
						components: [
							{
								internalType: "uint256",
								name: "amount",
								type: "uint256"
							},
							{
								internalType: "address payable",
								name: "recipient",
								type: "address"
							}
						],
						internalType: "struct AdditionalRecipient[]",
						name: "additionalRecipients",
						type: "tuple[]"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					}
				],
				internalType: "struct BasicOrderParameters",
				name: "parameters",
				type: "tuple"
			}
		],
		name: "fulfillBasicOrder",
		outputs: [
			{
				internalType: "bool",
				name: "fulfilled",
				type: "bool"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "offerer",
								type: "address"
							},
							{
								internalType: "address",
								name: "zone",
								type: "address"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									}
								],
								internalType: "struct OfferItem[]",
								name: "offer",
								type: "tuple[]"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									},
									{
										internalType: "address payable",
										name: "recipient",
										type: "address"
									}
								],
								internalType: "struct ConsiderationItem[]",
								name: "consideration",
								type: "tuple[]"
							},
							{
								internalType: "enum OrderType",
								name: "orderType",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "startTime",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endTime",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "zoneHash",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "conduitKey",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "totalOriginalConsiderationItems",
								type: "uint256"
							}
						],
						internalType: "struct OrderParameters",
						name: "parameters",
						type: "tuple"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					}
				],
				internalType: "struct Order",
				name: "order",
				type: "tuple"
			},
			{
				internalType: "bytes32",
				name: "fulfillerConduitKey",
				type: "bytes32"
			}
		],
		name: "fulfillOrder",
		outputs: [
			{
				internalType: "bool",
				name: "fulfilled",
				type: "bool"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "offerer",
				type: "address"
			}
		],
		name: "getCounter",
		outputs: [
			{
				internalType: "uint256",
				name: "counter",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "offerer",
						type: "address"
					},
					{
						internalType: "address",
						name: "zone",
						type: "address"
					},
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifierOrCriteria",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "startAmount",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endAmount",
								type: "uint256"
							}
						],
						internalType: "struct OfferItem[]",
						name: "offer",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifierOrCriteria",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "startAmount",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endAmount",
								type: "uint256"
							},
							{
								internalType: "address payable",
								name: "recipient",
								type: "address"
							}
						],
						internalType: "struct ConsiderationItem[]",
						name: "consideration",
						type: "tuple[]"
					},
					{
						internalType: "enum OrderType",
						name: "orderType",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "startTime",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "endTime",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "zoneHash",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "salt",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "conduitKey",
						type: "bytes32"
					},
					{
						internalType: "uint256",
						name: "counter",
						type: "uint256"
					}
				],
				internalType: "struct OrderComponents",
				name: "order",
				type: "tuple"
			}
		],
		name: "getOrderHash",
		outputs: [
			{
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "orderHash",
				type: "bytes32"
			}
		],
		name: "getOrderStatus",
		outputs: [
			{
				internalType: "bool",
				name: "isValidated",
				type: "bool"
			},
			{
				internalType: "bool",
				name: "isCancelled",
				type: "bool"
			},
			{
				internalType: "uint256",
				name: "totalFilled",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "totalSize",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "incrementCounter",
		outputs: [
			{
				internalType: "uint256",
				name: "newCounter",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "information",
		outputs: [
			{
				internalType: "string",
				name: "version",
				type: "string"
			},
			{
				internalType: "bytes32",
				name: "domainSeparator",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "conduitController",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "offerer",
								type: "address"
							},
							{
								internalType: "address",
								name: "zone",
								type: "address"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									}
								],
								internalType: "struct OfferItem[]",
								name: "offer",
								type: "tuple[]"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									},
									{
										internalType: "address payable",
										name: "recipient",
										type: "address"
									}
								],
								internalType: "struct ConsiderationItem[]",
								name: "consideration",
								type: "tuple[]"
							},
							{
								internalType: "enum OrderType",
								name: "orderType",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "startTime",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endTime",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "zoneHash",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "conduitKey",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "totalOriginalConsiderationItems",
								type: "uint256"
							}
						],
						internalType: "struct OrderParameters",
						name: "parameters",
						type: "tuple"
					},
					{
						internalType: "uint120",
						name: "numerator",
						type: "uint120"
					},
					{
						internalType: "uint120",
						name: "denominator",
						type: "uint120"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					},
					{
						internalType: "bytes",
						name: "extraData",
						type: "bytes"
					}
				],
				internalType: "struct AdvancedOrder[]",
				name: "advancedOrders",
				type: "tuple[]"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "orderIndex",
						type: "uint256"
					},
					{
						internalType: "enum Side",
						name: "side",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "index",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "identifier",
						type: "uint256"
					},
					{
						internalType: "bytes32[]",
						name: "criteriaProof",
						type: "bytes32[]"
					}
				],
				internalType: "struct CriteriaResolver[]",
				name: "criteriaResolvers",
				type: "tuple[]"
			},
			{
				components: [
					{
						components: [
							{
								internalType: "uint256",
								name: "orderIndex",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "itemIndex",
								type: "uint256"
							}
						],
						internalType: "struct FulfillmentComponent[]",
						name: "offerComponents",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "uint256",
								name: "orderIndex",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "itemIndex",
								type: "uint256"
							}
						],
						internalType: "struct FulfillmentComponent[]",
						name: "considerationComponents",
						type: "tuple[]"
					}
				],
				internalType: "struct Fulfillment[]",
				name: "fulfillments",
				type: "tuple[]"
			}
		],
		name: "matchAdvancedOrders",
		outputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifier",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "amount",
								type: "uint256"
							},
							{
								internalType: "address payable",
								name: "recipient",
								type: "address"
							}
						],
						internalType: "struct ReceivedItem",
						name: "item",
						type: "tuple"
					},
					{
						internalType: "address",
						name: "offerer",
						type: "address"
					},
					{
						internalType: "bytes32",
						name: "conduitKey",
						type: "bytes32"
					}
				],
				internalType: "struct Execution[]",
				name: "executions",
				type: "tuple[]"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "offerer",
								type: "address"
							},
							{
								internalType: "address",
								name: "zone",
								type: "address"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									}
								],
								internalType: "struct OfferItem[]",
								name: "offer",
								type: "tuple[]"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									},
									{
										internalType: "address payable",
										name: "recipient",
										type: "address"
									}
								],
								internalType: "struct ConsiderationItem[]",
								name: "consideration",
								type: "tuple[]"
							},
							{
								internalType: "enum OrderType",
								name: "orderType",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "startTime",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endTime",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "zoneHash",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "conduitKey",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "totalOriginalConsiderationItems",
								type: "uint256"
							}
						],
						internalType: "struct OrderParameters",
						name: "parameters",
						type: "tuple"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					}
				],
				internalType: "struct Order[]",
				name: "orders",
				type: "tuple[]"
			},
			{
				components: [
					{
						components: [
							{
								internalType: "uint256",
								name: "orderIndex",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "itemIndex",
								type: "uint256"
							}
						],
						internalType: "struct FulfillmentComponent[]",
						name: "offerComponents",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "uint256",
								name: "orderIndex",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "itemIndex",
								type: "uint256"
							}
						],
						internalType: "struct FulfillmentComponent[]",
						name: "considerationComponents",
						type: "tuple[]"
					}
				],
				internalType: "struct Fulfillment[]",
				name: "fulfillments",
				type: "tuple[]"
			}
		],
		name: "matchOrders",
		outputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "enum ItemType",
								name: "itemType",
								type: "uint8"
							},
							{
								internalType: "address",
								name: "token",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "identifier",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "amount",
								type: "uint256"
							},
							{
								internalType: "address payable",
								name: "recipient",
								type: "address"
							}
						],
						internalType: "struct ReceivedItem",
						name: "item",
						type: "tuple"
					},
					{
						internalType: "address",
						name: "offerer",
						type: "address"
					},
					{
						internalType: "bytes32",
						name: "conduitKey",
						type: "bytes32"
					}
				],
				internalType: "struct Execution[]",
				name: "executions",
				type: "tuple[]"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "name",
		outputs: [
			{
				internalType: "string",
				name: "contractName",
				type: "string"
			}
		],
		stateMutability: "pure",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "offerer",
								type: "address"
							},
							{
								internalType: "address",
								name: "zone",
								type: "address"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									}
								],
								internalType: "struct OfferItem[]",
								name: "offer",
								type: "tuple[]"
							},
							{
								components: [
									{
										internalType: "enum ItemType",
										name: "itemType",
										type: "uint8"
									},
									{
										internalType: "address",
										name: "token",
										type: "address"
									},
									{
										internalType: "uint256",
										name: "identifierOrCriteria",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "startAmount",
										type: "uint256"
									},
									{
										internalType: "uint256",
										name: "endAmount",
										type: "uint256"
									},
									{
										internalType: "address payable",
										name: "recipient",
										type: "address"
									}
								],
								internalType: "struct ConsiderationItem[]",
								name: "consideration",
								type: "tuple[]"
							},
							{
								internalType: "enum OrderType",
								name: "orderType",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "startTime",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "endTime",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "zoneHash",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "conduitKey",
								type: "bytes32"
							},
							{
								internalType: "uint256",
								name: "totalOriginalConsiderationItems",
								type: "uint256"
							}
						],
						internalType: "struct OrderParameters",
						name: "parameters",
						type: "tuple"
					},
					{
						internalType: "bytes",
						name: "signature",
						type: "bytes"
					}
				],
				internalType: "struct Order[]",
				name: "orders",
				type: "tuple[]"
			}
		],
		name: "validate",
		outputs: [
			{
				internalType: "bool",
				name: "validated",
				type: "bool"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	}
];

var SeaportTrade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(SeaportTrade, _NFTTrade);
  function SeaportTrade(orders) {
    return _NFTTrade.call(this, exports.Market.Seaport, orders) || this;
  }
  var _proto = SeaportTrade.prototype;
  _proto.encode = function encode(planner, config) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var order = _step.value;
      var advancedOrders = [];
      var orderFulfillments = order.items.map(function (_, index) {
        return [{
          orderIndex: index,
          itemIndex: 0
        }];
      });
      var considerationFulFillments = this.getConsiderationFulfillments(order.items);
      for (var _iterator2 = _createForOfIteratorHelperLoose(order.items), _step2; !(_step2 = _iterator2()).done;) {
        var item = _step2.value;
        var _this$getAdvancedOrde = this.getAdvancedOrderParams(item),
          advancedOrder = _this$getAdvancedOrde.advancedOrder;
        advancedOrders.push(advancedOrder);
      }
      var calldata = void 0;
      if (advancedOrders.length == 1) {
        calldata = SeaportTrade.INTERFACE.encodeFunctionData('fulfillAdvancedOrder', [advancedOrders[0], [], SeaportTrade.OPENSEA_CONDUIT_KEY, order.recipient]);
      } else {
        calldata = SeaportTrade.INTERFACE.encodeFunctionData('fulfillAvailableAdvancedOrders', [advancedOrders, [], orderFulfillments, considerationFulFillments, SeaportTrade.OPENSEA_CONDUIT_KEY, order.recipient, 100]);
      }
      if (!!order.inputTokenProcessing) {
        for (var _iterator3 = _createForOfIteratorHelperLoose(order.inputTokenProcessing), _step3; !(_step3 = _iterator3()).done;) {
          var inputToken = _step3.value;
          encodeInputTokenOptions(planner, {
            approval: inputToken.protocolApproval ? {
              token: inputToken.token,
              protocol: order.protocolAddress
            } : undefined,
            permit2Permit: inputToken.permit2Permit,
            permit2TransferFrom: inputToken.permit2TransferFrom ? {
              token: inputToken.token,
              amount: this.getTotalOrderPrice(order, inputToken.token).toString()
            } : undefined
          });
        }
      }
      planner.addCommand(this.commandMap(order.protocolAddress), [this.getTotalOrderPrice(order, ETH_ADDRESS).toString(), calldata], config.allowRevert);
    }
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator4 = _createForOfIteratorHelperLoose(this.orders), _step4; !(_step4 = _iterator4()).done;) {
      var order = _step4.value;
      for (var _iterator5 = _createForOfIteratorHelperLoose(order.items), _step5; !(_step5 = _iterator5()).done;) {
        var item = _step5.value;
        for (var _iterator6 = _createForOfIteratorHelperLoose(item.parameters.offer), _step6; !(_step6 = _iterator6()).done;) {
          var offer = _step6.value;
          buyItems.push({
            tokenAddress: offer.token,
            tokenId: offer.identifierOrCriteria,
            tokenType: exports.TokenType.ERC721
          });
        }
      }
    }
    return buyItems;
  };
  _proto.getInputTokens = function getInputTokens() {
    var inputTokens = new Set();
    for (var _iterator7 = _createForOfIteratorHelperLoose(this.orders), _step7; !(_step7 = _iterator7()).done;) {
      var order = _step7.value;
      for (var _iterator8 = _createForOfIteratorHelperLoose(order.items), _step8; !(_step8 = _iterator8()).done;) {
        var item = _step8.value;
        for (var _iterator9 = _createForOfIteratorHelperLoose(item.parameters.consideration), _step9; !(_step9 = _iterator9()).done;) {
          var consideration = _step9.value;
          var token = consideration.token.toLowerCase();
          inputTokens.add(token);
        }
      }
    }
    return inputTokens;
  };
  _proto.getTotalOrderPrice = function getTotalOrderPrice(order, token) {
    if (token === void 0) {
      token = ETH_ADDRESS;
    }
    var totalOrderPrice = ethers.BigNumber.from(0);
    for (var _iterator10 = _createForOfIteratorHelperLoose(order.items), _step10; !(_step10 = _iterator10()).done;) {
      var item = _step10.value;
      totalOrderPrice = totalOrderPrice.add(this.calculateValue(item.parameters.consideration, token));
    }
    return totalOrderPrice;
  };
  _proto.getTotalPrice = function getTotalPrice(token) {
    if (token === void 0) {
      token = ETH_ADDRESS;
    }
    var totalPrice = ethers.BigNumber.from(0);
    for (var _iterator11 = _createForOfIteratorHelperLoose(this.orders), _step11; !(_step11 = _iterator11()).done;) {
      var order = _step11.value;
      for (var _iterator12 = _createForOfIteratorHelperLoose(order.items), _step12; !(_step12 = _iterator12()).done;) {
        var item = _step12.value;
        totalPrice = totalPrice.add(this.calculateValue(item.parameters.consideration, token));
      }
    }
    return totalPrice;
  };
  _proto.commandMap = function commandMap(protocolAddress) {
    switch (protocolAddress.toLowerCase()) {
      case '0x00000000000000adc04c56bf30ac9d3c0aaf14dc':
        // Seaport v1.5
        return CommandType.SEAPORT_V1_5;
      case '0x00000000000001ad428e4906ae43d8f9852d0dd6':
        // Seaport v1.4
        return CommandType.SEAPORT_V1_4;
      default:
        throw new Error('unsupported Seaport address');
    }
  };
  _proto.getConsiderationFulfillments = function getConsiderationFulfillments(protocolDatas) {
    var considerationFulfillments = [];
    var considerationRecipients = [];
    for (var i in protocolDatas) {
      var protocolData = protocolDatas[i];
      var _loop = function _loop(j) {
        var item = protocolData.parameters.consideration[j];
        if (considerationRecipients.findIndex(function (x) {
          return x === item.recipient;
        }) === -1) {
          considerationRecipients.push(item.recipient);
        }
        var recipientIndex = considerationRecipients.findIndex(function (x) {
          return x === item.recipient;
        });
        if (!considerationFulfillments[recipientIndex]) {
          considerationFulfillments.push([{
            orderIndex: i,
            itemIndex: j
          }]);
        } else {
          considerationFulfillments[recipientIndex].push({
            orderIndex: i,
            itemIndex: j
          });
        }
      };
      for (var j in protocolData.parameters.consideration) {
        _loop(j);
      }
    }
    return considerationFulfillments;
  };
  _proto.getAdvancedOrderParams = function getAdvancedOrderParams(data) {
    var advancedOrder = {
      parameters: data.parameters,
      numerator: ethers.BigNumber.from('1'),
      denominator: ethers.BigNumber.from('1'),
      signature: data.signature,
      extraData: '0x00'
    };
    return {
      advancedOrder: advancedOrder
    };
  };
  _proto.calculateValue = function calculateValue(considerations, token) {
    return considerations.reduce(function (amt, consideration) {
      return consideration.token.toLowerCase() == token.toLowerCase() ? amt.add(consideration.startAmount) : amt;
    }, ethers.BigNumber.from(0));
  };
  return SeaportTrade;
}(NFTTrade);
SeaportTrade.INTERFACE = /*#__PURE__*/new abi$7.Interface(abi$4);
SeaportTrade.OPENSEA_CONDUIT_KEY = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000';

var abi$5 = [
	{
		inputs: [
			{
				internalType: "contract ILSSVMPairFactoryLike",
				name: "_factory",
				type: "address"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		inputs: [
		],
		name: "factory",
		outputs: [
			{
				internalType: "contract ILSSVMPairFactoryLike",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "contract ERC20",
				name: "token",
				type: "address"
			},
			{
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				internalType: "enum ILSSVMPairFactoryLike.PairVariant",
				name: "variant",
				type: "uint8"
			}
		],
		name: "pairTransferERC20From",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "contract IERC721",
				name: "nft",
				type: "address"
			},
			{
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "id",
				type: "uint256"
			},
			{
				internalType: "enum ILSSVMPairFactoryLike.PairVariant",
				name: "variant",
				type: "uint8"
			}
		],
		name: "pairTransferNFTFrom",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "numItems",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapAny",
						name: "swapInfo",
						type: "tuple"
					},
					{
						internalType: "uint256",
						name: "maxCost",
						type: "uint256"
					}
				],
				internalType: "struct LSSVMRouter.RobustPairSwapAny[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "uint256",
				name: "inputAmount",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "robustSwapERC20ForAnyNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific",
						name: "swapInfo",
						type: "tuple"
					},
					{
						internalType: "uint256",
						name: "maxCost",
						type: "uint256"
					}
				],
				internalType: "struct LSSVMRouter.RobustPairSwapSpecific[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "uint256",
				name: "inputAmount",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "robustSwapERC20ForSpecificNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								components: [
									{
										internalType: "contract LSSVMPair",
										name: "pair",
										type: "address"
									},
									{
										internalType: "uint256[]",
										name: "nftIds",
										type: "uint256[]"
									}
								],
								internalType: "struct LSSVMRouter.PairSwapSpecific",
								name: "swapInfo",
								type: "tuple"
							},
							{
								internalType: "uint256",
								name: "maxCost",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.RobustPairSwapSpecific[]",
						name: "tokenToNFTTrades",
						type: "tuple[]"
					},
					{
						components: [
							{
								components: [
									{
										internalType: "contract LSSVMPair",
										name: "pair",
										type: "address"
									},
									{
										internalType: "uint256[]",
										name: "nftIds",
										type: "uint256[]"
									}
								],
								internalType: "struct LSSVMRouter.PairSwapSpecific",
								name: "swapInfo",
								type: "tuple"
							},
							{
								internalType: "uint256",
								name: "minOutput",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.RobustPairSwapSpecificForToken[]",
						name: "nftToTokenTrades",
						type: "tuple[]"
					},
					{
						internalType: "uint256",
						name: "inputAmount",
						type: "uint256"
					},
					{
						internalType: "address payable",
						name: "tokenRecipient",
						type: "address"
					},
					{
						internalType: "address",
						name: "nftRecipient",
						type: "address"
					}
				],
				internalType: "struct LSSVMRouter.RobustPairNFTsFoTokenAndTokenforNFTsTrade",
				name: "params",
				type: "tuple"
			}
		],
		name: "robustSwapERC20ForSpecificNFTsAndNFTsToToken",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "numItems",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapAny",
						name: "swapInfo",
						type: "tuple"
					},
					{
						internalType: "uint256",
						name: "maxCost",
						type: "uint256"
					}
				],
				internalType: "struct LSSVMRouter.RobustPairSwapAny[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "address payable",
				name: "ethRecipient",
				type: "address"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "robustSwapETHForAnyNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific",
						name: "swapInfo",
						type: "tuple"
					},
					{
						internalType: "uint256",
						name: "maxCost",
						type: "uint256"
					}
				],
				internalType: "struct LSSVMRouter.RobustPairSwapSpecific[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "address payable",
				name: "ethRecipient",
				type: "address"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "robustSwapETHForSpecificNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								components: [
									{
										internalType: "contract LSSVMPair",
										name: "pair",
										type: "address"
									},
									{
										internalType: "uint256[]",
										name: "nftIds",
										type: "uint256[]"
									}
								],
								internalType: "struct LSSVMRouter.PairSwapSpecific",
								name: "swapInfo",
								type: "tuple"
							},
							{
								internalType: "uint256",
								name: "maxCost",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.RobustPairSwapSpecific[]",
						name: "tokenToNFTTrades",
						type: "tuple[]"
					},
					{
						components: [
							{
								components: [
									{
										internalType: "contract LSSVMPair",
										name: "pair",
										type: "address"
									},
									{
										internalType: "uint256[]",
										name: "nftIds",
										type: "uint256[]"
									}
								],
								internalType: "struct LSSVMRouter.PairSwapSpecific",
								name: "swapInfo",
								type: "tuple"
							},
							{
								internalType: "uint256",
								name: "minOutput",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.RobustPairSwapSpecificForToken[]",
						name: "nftToTokenTrades",
						type: "tuple[]"
					},
					{
						internalType: "uint256",
						name: "inputAmount",
						type: "uint256"
					},
					{
						internalType: "address payable",
						name: "tokenRecipient",
						type: "address"
					},
					{
						internalType: "address",
						name: "nftRecipient",
						type: "address"
					}
				],
				internalType: "struct LSSVMRouter.RobustPairNFTsFoTokenAndTokenforNFTsTrade",
				name: "params",
				type: "tuple"
			}
		],
		name: "robustSwapETHForSpecificNFTsAndNFTsToToken",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific",
						name: "swapInfo",
						type: "tuple"
					},
					{
						internalType: "uint256",
						name: "minOutput",
						type: "uint256"
					}
				],
				internalType: "struct LSSVMRouter.RobustPairSwapSpecificForToken[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "address payable",
				name: "tokenRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "robustSwapNFTsForToken",
		outputs: [
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "contract LSSVMPair",
						name: "pair",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "numItems",
						type: "uint256"
					}
				],
				internalType: "struct LSSVMRouter.PairSwapAny[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "uint256",
				name: "inputAmount",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapERC20ForAnyNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "contract LSSVMPair",
						name: "pair",
						type: "address"
					},
					{
						internalType: "uint256[]",
						name: "nftIds",
						type: "uint256[]"
					}
				],
				internalType: "struct LSSVMRouter.PairSwapSpecific[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "uint256",
				name: "inputAmount",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapERC20ForSpecificNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "contract LSSVMPair",
						name: "pair",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "numItems",
						type: "uint256"
					}
				],
				internalType: "struct LSSVMRouter.PairSwapAny[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "address payable",
				name: "ethRecipient",
				type: "address"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapETHForAnyNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "contract LSSVMPair",
						name: "pair",
						type: "address"
					},
					{
						internalType: "uint256[]",
						name: "nftIds",
						type: "uint256[]"
					}
				],
				internalType: "struct LSSVMRouter.PairSwapSpecific[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "address payable",
				name: "ethRecipient",
				type: "address"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapETHForSpecificNFTs",
		outputs: [
			{
				internalType: "uint256",
				name: "remainingValue",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific[]",
						name: "nftToTokenTrades",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "numItems",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapAny[]",
						name: "tokenToNFTTrades",
						type: "tuple[]"
					}
				],
				internalType: "struct LSSVMRouter.NFTsForAnyNFTsTrade",
				name: "trade",
				type: "tuple"
			},
			{
				internalType: "uint256",
				name: "inputAmount",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "minOutput",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapNFTsForAnyNFTsThroughERC20",
		outputs: [
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific[]",
						name: "nftToTokenTrades",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "numItems",
								type: "uint256"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapAny[]",
						name: "tokenToNFTTrades",
						type: "tuple[]"
					}
				],
				internalType: "struct LSSVMRouter.NFTsForAnyNFTsTrade",
				name: "trade",
				type: "tuple"
			},
			{
				internalType: "uint256",
				name: "minOutput",
				type: "uint256"
			},
			{
				internalType: "address payable",
				name: "ethRecipient",
				type: "address"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapNFTsForAnyNFTsThroughETH",
		outputs: [
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific[]",
						name: "nftToTokenTrades",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific[]",
						name: "tokenToNFTTrades",
						type: "tuple[]"
					}
				],
				internalType: "struct LSSVMRouter.NFTsForSpecificNFTsTrade",
				name: "trade",
				type: "tuple"
			},
			{
				internalType: "uint256",
				name: "inputAmount",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "minOutput",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapNFTsForSpecificNFTsThroughERC20",
		outputs: [
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific[]",
						name: "nftToTokenTrades",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "contract LSSVMPair",
								name: "pair",
								type: "address"
							},
							{
								internalType: "uint256[]",
								name: "nftIds",
								type: "uint256[]"
							}
						],
						internalType: "struct LSSVMRouter.PairSwapSpecific[]",
						name: "tokenToNFTTrades",
						type: "tuple[]"
					}
				],
				internalType: "struct LSSVMRouter.NFTsForSpecificNFTsTrade",
				name: "trade",
				type: "tuple"
			},
			{
				internalType: "uint256",
				name: "minOutput",
				type: "uint256"
			},
			{
				internalType: "address payable",
				name: "ethRecipient",
				type: "address"
			},
			{
				internalType: "address",
				name: "nftRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapNFTsForSpecificNFTsThroughETH",
		outputs: [
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "contract LSSVMPair",
						name: "pair",
						type: "address"
					},
					{
						internalType: "uint256[]",
						name: "nftIds",
						type: "uint256[]"
					}
				],
				internalType: "struct LSSVMRouter.PairSwapSpecific[]",
				name: "swapList",
				type: "tuple[]"
			},
			{
				internalType: "uint256",
				name: "minOutput",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "tokenRecipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapNFTsForToken",
		outputs: [
			{
				internalType: "uint256",
				name: "outputAmount",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		stateMutability: "payable",
		type: "receive"
	}
];

var SudoswapTrade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(SudoswapTrade, _NFTTrade);
  function SudoswapTrade(orders) {
    return _NFTTrade.call(this, exports.Market.Sudoswap, orders) || this;
  }
  var _proto = SudoswapTrade.prototype;
  _proto.encode = function encode(planner, config) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var order = _step.value;
      var calldata = SudoswapTrade.INTERFACE.encodeFunctionData('robustSwapETHForSpecificNFTs', [order.swaps.map(function (swap) {
        return {
          swapInfo: swap.swapInfo,
          maxCost: swap.maxCost
        };
      }), order.ethRecipient, order.nftRecipient, order.deadline]);
      var value = order.swaps.reduce(function (prevVal, swap) {
        return prevVal.add(swap.maxCost);
      }, ethers.BigNumber.from(0));
      planner.addCommand(CommandType.SUDOSWAP, [value, calldata], config.allowRevert);
    }
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator2 = _createForOfIteratorHelperLoose(this.orders), _step2; !(_step2 = _iterator2()).done;) {
      var order = _step2.value;
      for (var _iterator3 = _createForOfIteratorHelperLoose(order.swaps), _step3; !(_step3 = _iterator3()).done;) {
        var swap = _step3.value;
        for (var _iterator4 = _createForOfIteratorHelperLoose(swap.swapInfo.nftIds), _step4; !(_step4 = _iterator4()).done;) {
          var tokenId = _step4.value;
          buyItems.push({
            tokenAddress: swap.tokenAddress,
            tokenId: tokenId,
            tokenType: exports.TokenType.ERC721
          });
        }
      }
    }
    return buyItems;
  };
  _proto.getTotalPrice = function getTotalPrice() {
    var total = ethers.BigNumber.from(0);
    for (var _iterator5 = _createForOfIteratorHelperLoose(this.orders), _step5; !(_step5 = _iterator5()).done;) {
      var order = _step5.value;
      for (var _iterator6 = _createForOfIteratorHelperLoose(order.swaps), _step6; !(_step6 = _iterator6()).done;) {
        var swap = _step6.value;
        total = total.add(swap.maxCost);
      }
    }
    return total;
  };
  return SudoswapTrade;
}(NFTTrade);
SudoswapTrade.INTERFACE = /*#__PURE__*/new abi$7.Interface(abi$5);

var abi$6 = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "itemHash",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "address",
				name: "currency",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "incentive",
				type: "uint256"
			}
		],
		name: "EvAuctionRefund",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "itemHash",
				type: "bytes32"
			}
		],
		name: "EvCancel",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "delegate",
				type: "address"
			},
			{
				indexed: false,
				internalType: "bool",
				name: "isRemoval",
				type: "bool"
			}
		],
		name: "EvDelegate",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "index",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "error",
				type: "bytes"
			}
		],
		name: "EvFailure",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "newValue",
				type: "uint256"
			}
		],
		name: "EvFeeCapUpdate",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "itemHash",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "address",
				name: "maker",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "taker",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "orderSalt",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "settleSalt",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "intent",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "delegateType",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "contract IERC20Upgradeable",
				name: "currency",
				type: "address"
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "dataMask",
				type: "bytes"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "price",
						type: "uint256"
					},
					{
						internalType: "bytes",
						name: "data",
						type: "bytes"
					}
				],
				indexed: false,
				internalType: "struct Market.OrderItem",
				name: "item",
				type: "tuple"
			},
			{
				components: [
					{
						internalType: "enum Market.Op",
						name: "op",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "orderIdx",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "itemIdx",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "price",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "itemHash",
						type: "bytes32"
					},
					{
						internalType: "contract IDelegate",
						name: "executionDelegate",
						type: "address"
					},
					{
						internalType: "bytes",
						name: "dataReplacement",
						type: "bytes"
					},
					{
						internalType: "uint256",
						name: "bidIncentivePct",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "aucMinIncrementPct",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "aucIncDurationSecs",
						type: "uint256"
					},
					{
						components: [
							{
								internalType: "uint256",
								name: "percentage",
								type: "uint256"
							},
							{
								internalType: "address",
								name: "to",
								type: "address"
							}
						],
						internalType: "struct Market.Fee[]",
						name: "fees",
						type: "tuple[]"
					}
				],
				indexed: false,
				internalType: "struct Market.SettleDetail",
				name: "detail",
				type: "tuple"
			}
		],
		name: "EvInventory",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "bytes32",
				name: "itemHash",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "address",
				name: "currency",
				type: "address"
			},
			{
				indexed: false,
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "EvProfit",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "signer",
				type: "address"
			},
			{
				indexed: false,
				internalType: "bool",
				name: "isRemoval",
				type: "bool"
			}
		],
		name: "EvSigner",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address"
			}
		],
		name: "OwnershipTransferred",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address"
			}
		],
		name: "Paused",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address"
			}
		],
		name: "Unpaused",
		type: "event"
	},
	{
		inputs: [
		],
		name: "RATE_BASE",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32[]",
				name: "itemHashes",
				type: "bytes32[]"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			},
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			},
			{
				internalType: "bytes32",
				name: "r",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "s",
				type: "bytes32"
			}
		],
		name: "cancel",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "delegates",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "feeCapPct",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "feeCapPct_",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "weth_",
				type: "address"
			}
		],
		name: "initialize",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		name: "inventoryStatus",
		outputs: [
			{
				internalType: "enum Market.InvStatus",
				name: "",
				type: "uint8"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		name: "ongoingAuctions",
		outputs: [
			{
				internalType: "uint256",
				name: "price",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "netPrice",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "endAt",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "bidder",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "pause",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "paused",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "renounceOwnership",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "address",
								name: "user",
								type: "address"
							},
							{
								internalType: "uint256",
								name: "network",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "intent",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "delegateType",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "deadline",
								type: "uint256"
							},
							{
								internalType: "contract IERC20Upgradeable",
								name: "currency",
								type: "address"
							},
							{
								internalType: "bytes",
								name: "dataMask",
								type: "bytes"
							},
							{
								components: [
									{
										internalType: "uint256",
										name: "price",
										type: "uint256"
									},
									{
										internalType: "bytes",
										name: "data",
										type: "bytes"
									}
								],
								internalType: "struct Market.OrderItem[]",
								name: "items",
								type: "tuple[]"
							},
							{
								internalType: "bytes32",
								name: "r",
								type: "bytes32"
							},
							{
								internalType: "bytes32",
								name: "s",
								type: "bytes32"
							},
							{
								internalType: "uint8",
								name: "v",
								type: "uint8"
							},
							{
								internalType: "uint8",
								name: "signVersion",
								type: "uint8"
							}
						],
						internalType: "struct Market.Order[]",
						name: "orders",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "enum Market.Op",
								name: "op",
								type: "uint8"
							},
							{
								internalType: "uint256",
								name: "orderIdx",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "itemIdx",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "price",
								type: "uint256"
							},
							{
								internalType: "bytes32",
								name: "itemHash",
								type: "bytes32"
							},
							{
								internalType: "contract IDelegate",
								name: "executionDelegate",
								type: "address"
							},
							{
								internalType: "bytes",
								name: "dataReplacement",
								type: "bytes"
							},
							{
								internalType: "uint256",
								name: "bidIncentivePct",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "aucMinIncrementPct",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "aucIncDurationSecs",
								type: "uint256"
							},
							{
								components: [
									{
										internalType: "uint256",
										name: "percentage",
										type: "uint256"
									},
									{
										internalType: "address",
										name: "to",
										type: "address"
									}
								],
								internalType: "struct Market.Fee[]",
								name: "fees",
								type: "tuple[]"
							}
						],
						internalType: "struct Market.SettleDetail[]",
						name: "details",
						type: "tuple[]"
					},
					{
						components: [
							{
								internalType: "uint256",
								name: "salt",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "deadline",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "amountToEth",
								type: "uint256"
							},
							{
								internalType: "uint256",
								name: "amountToWeth",
								type: "uint256"
							},
							{
								internalType: "address",
								name: "user",
								type: "address"
							},
							{
								internalType: "bool",
								name: "canFail",
								type: "bool"
							}
						],
						internalType: "struct Market.SettleShared",
						name: "shared",
						type: "tuple"
					},
					{
						internalType: "bytes32",
						name: "r",
						type: "bytes32"
					},
					{
						internalType: "bytes32",
						name: "s",
						type: "bytes32"
					},
					{
						internalType: "uint8",
						name: "v",
						type: "uint8"
					}
				],
				internalType: "struct Market.RunInput",
				name: "input",
				type: "tuple"
			}
		],
		name: "run",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "uint256",
						name: "salt",
						type: "uint256"
					},
					{
						internalType: "address",
						name: "user",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "network",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "intent",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "delegateType",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "deadline",
						type: "uint256"
					},
					{
						internalType: "contract IERC20Upgradeable",
						name: "currency",
						type: "address"
					},
					{
						internalType: "bytes",
						name: "dataMask",
						type: "bytes"
					},
					{
						components: [
							{
								internalType: "uint256",
								name: "price",
								type: "uint256"
							},
							{
								internalType: "bytes",
								name: "data",
								type: "bytes"
							}
						],
						internalType: "struct Market.OrderItem[]",
						name: "items",
						type: "tuple[]"
					},
					{
						internalType: "bytes32",
						name: "r",
						type: "bytes32"
					},
					{
						internalType: "bytes32",
						name: "s",
						type: "bytes32"
					},
					{
						internalType: "uint8",
						name: "v",
						type: "uint8"
					},
					{
						internalType: "uint8",
						name: "signVersion",
						type: "uint8"
					}
				],
				internalType: "struct Market.Order",
				name: "order",
				type: "tuple"
			},
			{
				components: [
					{
						internalType: "uint256",
						name: "salt",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "deadline",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "amountToEth",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "amountToWeth",
						type: "uint256"
					},
					{
						internalType: "address",
						name: "user",
						type: "address"
					},
					{
						internalType: "bool",
						name: "canFail",
						type: "bool"
					}
				],
				internalType: "struct Market.SettleShared",
				name: "shared",
				type: "tuple"
			},
			{
				components: [
					{
						internalType: "enum Market.Op",
						name: "op",
						type: "uint8"
					},
					{
						internalType: "uint256",
						name: "orderIdx",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "itemIdx",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "price",
						type: "uint256"
					},
					{
						internalType: "bytes32",
						name: "itemHash",
						type: "bytes32"
					},
					{
						internalType: "contract IDelegate",
						name: "executionDelegate",
						type: "address"
					},
					{
						internalType: "bytes",
						name: "dataReplacement",
						type: "bytes"
					},
					{
						internalType: "uint256",
						name: "bidIncentivePct",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "aucMinIncrementPct",
						type: "uint256"
					},
					{
						internalType: "uint256",
						name: "aucIncDurationSecs",
						type: "uint256"
					},
					{
						components: [
							{
								internalType: "uint256",
								name: "percentage",
								type: "uint256"
							},
							{
								internalType: "address",
								name: "to",
								type: "address"
							}
						],
						internalType: "struct Market.Fee[]",
						name: "fees",
						type: "tuple[]"
					}
				],
				internalType: "struct Market.SettleDetail",
				name: "detail",
				type: "tuple"
			}
		],
		name: "run1",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "signers",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newOwner",
				type: "address"
			}
		],
		name: "transferOwnership",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "unpause",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address[]",
				name: "toAdd",
				type: "address[]"
			},
			{
				internalType: "address[]",
				name: "toRemove",
				type: "address[]"
			}
		],
		name: "updateDelegates",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "val",
				type: "uint256"
			}
		],
		name: "updateFeeCap",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address[]",
				name: "toAdd",
				type: "address[]"
			},
			{
				internalType: "address[]",
				name: "toRemove",
				type: "address[]"
			}
		],
		name: "updateSigners",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "weth",
		outputs: [
			{
				internalType: "contract IWETHUpgradable",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		stateMutability: "payable",
		type: "receive"
	}
];

var X2Y2Trade = /*#__PURE__*/function (_NFTTrade) {
  _inheritsLoose(X2Y2Trade, _NFTTrade);
  function X2Y2Trade(orders) {
    return _NFTTrade.call(this, exports.Market.X2Y2, orders) || this;
  }
  var _proto = X2Y2Trade.prototype;
  _proto.encode = function encode(planner, config) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.orders), _step; !(_step = _iterator()).done;) {
      var item = _step.value;
      var functionSelector = X2Y2Trade.INTERFACE.getSighash(X2Y2Trade.INTERFACE.getFunction('run'));
      var calldata = functionSelector + item.signedInput.slice(2);
      if (item.tokenType == exports.TokenType.ERC721) {
        planner.addCommand(CommandType.X2Y2_721, [item.price, calldata, item.recipient, item.tokenAddress, item.tokenId], config.allowRevert);
      } else if (item.tokenType == exports.TokenType.ERC1155) {
        planner.addCommand(CommandType.X2Y2_1155, [item.price, calldata, item.recipient, item.tokenAddress, item.tokenId, item.tokenAmount], config.allowRevert);
      }
    }
  };
  _proto.getBuyItems = function getBuyItems() {
    var buyItems = [];
    for (var _iterator2 = _createForOfIteratorHelperLoose(this.orders), _step2; !(_step2 = _iterator2()).done;) {
      var item = _step2.value;
      buyItems.push({
        tokenAddress: item.tokenAddress,
        tokenId: item.tokenId,
        tokenType: item.tokenType
      });
    }
    return buyItems;
  };
  _proto.getTotalPrice = function getTotalPrice() {
    var total = ethers.BigNumber.from(0);
    for (var _iterator3 = _createForOfIteratorHelperLoose(this.orders), _step3; !(_step3 = _iterator3()).done;) {
      var item = _step3.value;
      total = total.add(item.price);
    }
    return total;
  };
  return X2Y2Trade;
}(NFTTrade);
X2Y2Trade.INTERFACE = /*#__PURE__*/new abi$7.Interface(abi$6);

var UnwrapWETH = /*#__PURE__*/function () {
  function UnwrapWETH(amount, chainId, permit2) {
    this.tradeType = exports.RouterTradeType.UnwrapWETH;
    this.wethAddress = WETH_ADDRESS(chainId);
    this.amount = amount;
    if (!!permit2) {
      !(permit2.details.token.toLowerCase() === this.wethAddress.toLowerCase()) ?  invariant(false, "must be permitting WETH address: " + this.wethAddress)  : void 0;
      !(permit2.details.amount >= amount) ?  invariant(false, "Did not permit enough WETH for unwrapWETH transaction")  : void 0;
      this.permit2Data = permit2;
    }
  }
  var _proto = UnwrapWETH.prototype;
  _proto.encode = function encode(planner, _) {
    encodeInputTokenOptions(planner, {
      permit2Permit: this.permit2Data,
      permit2TransferFrom: {
        token: this.wethAddress,
        amount: this.amount.toString()
      }
    });
    planner.addCommand(CommandType.UNWRAP_WETH, [ROUTER_AS_RECIPIENT, this.amount]);
  };
  return UnwrapWETH;
}();

exports.CryptopunkTrade = CryptopunkTrade;
exports.FoundationTrade = FoundationTrade;
exports.LooksRareV2Trade = LooksRareV2Trade;
exports.NFT20Trade = NFT20Trade;
exports.NFTTrade = NFTTrade;
exports.NFTXTrade = NFTXTrade;
exports.PERMIT2_ADDRESS = PERMIT2_ADDRESS;
exports.ROUTER_AS_RECIPIENT = ROUTER_AS_RECIPIENT;
exports.SeaportTrade = SeaportTrade;
exports.SudoswapTrade = SudoswapTrade;
exports.SwapRouter = SwapRouter;
exports.UNIVERSAL_ROUTER_ADDRESS = UNIVERSAL_ROUTER_ADDRESS;
exports.UNIVERSAL_ROUTER_CREATION_BLOCK = UNIVERSAL_ROUTER_CREATION_BLOCK;
exports.UniswapTrade = UniswapTrade;
exports.UnwrapWETH = UnwrapWETH;
exports.WETH_ADDRESS = WETH_ADDRESS;
exports.X2Y2Trade = X2Y2Trade;
//# sourceMappingURL=universal-router-sdk.cjs.development.js.map
