/**
 * Pure, framework-free helpers for the swap UI.
 * Extracted so the math/formatting can be unit-tested without rendering React.
 */

export type SwapDir = 'AETH_TO_XLM' | 'XLM_TO_AETH';

/** Estimated output for a swap given a unit price (AETH priced in XLM). */
export function calcAmountOut(amountIn: string, price: number, dir: SwapDir): string {
  const amt = parseFloat(amountIn);
  if (!isFinite(amt) || amt <= 0 || !isFinite(price) || price <= 0) return '';
  const out = dir === 'AETH_TO_XLM' ? amt * price : amt / price;
  return out.toFixed(6);
}

/** True when the requested input exceeds the available balance. */
export function isInsufficientBalance(amountIn: string, balance: string): boolean {
  const amt = parseFloat(amountIn);
  const bal = parseFloat(balance);
  if (!isFinite(amt) || amt <= 0) return false;
  if (!isFinite(bal)) return true;
  return amt > bal;
}

/** Shorten a Stellar address to `GABCD...WXYZ` form. */
export function truncateAddress(address: string): string {
  if (!address || address.length <= 9) return address || '';
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

/** Apply the minimum-out slippage floor for a given tolerance (e.g. 0.005 = 0.5%). */
export function minAmountOut(amountOut: string, slippage: number): number {
  const out = parseFloat(amountOut);
  if (!isFinite(out) || out <= 0) return 0;
  const tol = isFinite(slippage) && slippage > 0 ? slippage : 0;
  return out * (1 - tol);
}
