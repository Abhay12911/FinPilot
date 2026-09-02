// MarketSignals.jsx imports `getMarketSignals` from '../services/market'
// while every other market-data component imports from
// '../services/marketService'. Rather than guess at how/why these ended
// up as two separate files and risk breaking whichever one is "real",
// this re-exports the same implementation so both import paths work
// identically and there's a single source of truth.
export { getMarketSignals } from './marketService';
