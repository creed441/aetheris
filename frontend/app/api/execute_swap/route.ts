import { NextResponse } from 'next/server';
import {
  rpc, Contract, nativeToScVal, Account, TransactionBuilder, Networks, Address
} from '@stellar/stellar-sdk';

const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const POOL_CONTRACT = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || '';
const TOKEN_CONTRACT = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '';
const XLM_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export async function POST(req: Request) {
  try {
    const { publicKey, dir, amountIn, amountOut, slippage = 0.01 } = await req.json();

    if (!publicKey || !dir || !amountIn || !amountOut) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    if (!POOL_CONTRACT || !TOKEN_CONTRACT) {
      return NextResponse.json({ error: 'Contracts not configured' }, { status: 500 });
    }

    const rpcServer = new rpc.Server(RPC_URL);
    const pool = new Contract(POOL_CONTRACT);

    // Calculate minAmountOut based on slippage tolerance
    const amtOutNum = parseFloat(amountOut);
    const minAmtOutNum = amtOutNum * (1 - slippage);
    
    // Convert to stroops (7 decimals)
    const amtInStroops = Math.floor(parseFloat(amountIn) * 1e7);
    const minOutStroops = Math.floor(minAmtOutNum * 1e7);

    const tokenIn = dir === 'AETH_TO_XLM' ? TOKEN_CONTRACT : XLM_CONTRACT;

    // Fetch account sequence from Horizon
    const horizonUrl = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
    const accResponse = await fetch(`${horizonUrl}/accounts/${publicKey}`);
    if (!accResponse.ok) {
      throw new Error(`Failed to fetch account sequence from Horizon: ${accResponse.statusText}`);
    }
    const accJson = await accResponse.json();
    const seq = accJson.sequence || '0';
    const dummyAccount = new Account(publicKey, seq);

    // Build execute_swap call operation
    const op = pool.call(
      'execute_swap',
      new Address(publicKey).toScVal(),
      new Address(tokenIn).toScVal(),
      nativeToScVal(amtInStroops, { type: 'i128' }),
      nativeToScVal(minOutStroops, { type: 'i128' })
    );

    let tx = new TransactionBuilder(dummyAccount, {
      fee: '100000', // Soroban txs need higher base fee buffer, prepareTransaction will compute actual
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(op)
      .setTimeout(180)
      .build();

    // Simulate and prepare (adds footprint and resolves actual fee)
    tx = await rpcServer.prepareTransaction(tx);

    return NextResponse.json({ xdr: tx.toXDR() });
  } catch (err: any) {
    console.error('execute_swap prepare error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
