import { describe, it, expect } from 'vitest';
import {
  calcAmountOut,
  isInsufficientBalance,
  truncateAddress,
  minAmountOut,
} from './swapMath';

describe('calcAmountOut', () => {
  it('multiplies by price for AETH→XLM', () => {
    expect(calcAmountOut('10', 0.05, 'AETH_TO_XLM')).toBe('0.500000');
  });
  it('divides by price for XLM→AETH', () => {
    expect(calcAmountOut('1', 0.05, 'XLM_TO_AETH')).toBe('20.000000');
  });
  it('returns empty for non-positive or invalid input', () => {
    expect(calcAmountOut('0', 0.05, 'AETH_TO_XLM')).toBe('');
    expect(calcAmountOut('abc', 0.05, 'AETH_TO_XLM')).toBe('');
    expect(calcAmountOut('5', 0, 'AETH_TO_XLM')).toBe('');
  });
});

describe('isInsufficientBalance', () => {
  it('flags amounts above balance', () => {
    expect(isInsufficientBalance('100', '50')).toBe(true);
  });
  it('allows amounts at or below balance', () => {
    expect(isInsufficientBalance('50', '50')).toBe(false);
    expect(isInsufficientBalance('10', '50')).toBe(false);
  });
  it('ignores empty/zero input', () => {
    expect(isInsufficientBalance('', '50')).toBe(false);
    expect(isInsufficientBalance('0', '50')).toBe(false);
  });
});

describe('truncateAddress', () => {
  it('shortens a full Stellar address', () => {
    expect(truncateAddress('GBALPCSLWTTOVYUJ35KSDBOQETFDFAGKMQOYN76OWLY7QCIHLQUHINBS')).toBe('GBALP...INBS');
  });
  it('returns short strings unchanged', () => {
    expect(truncateAddress('GABC')).toBe('GABC');
    expect(truncateAddress('')).toBe('');
  });
});

describe('minAmountOut', () => {
  it('applies the slippage floor', () => {
    expect(minAmountOut('100', 0.005)).toBeCloseTo(99.5, 5);
  });
  it('returns the full amount with no slippage', () => {
    expect(minAmountOut('100', 0)).toBe(100);
  });
  it('returns 0 for invalid output', () => {
    expect(minAmountOut('0', 0.005)).toBe(0);
  });
});
