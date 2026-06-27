import { NextResponse } from 'next/server';
import {
  rpc, Contract, nativeToScVal, Account, TransactionBuilder, Networks, Address
} from '@stellar/stellar-sdk';

const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const POOL_CONTRACT = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || '';

export async function POST(req: Request) {
  try {
    const { publicKey, action, aetherAmt, xlmAmt, lpAmt } = await req.json();

    if (!publicKey || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    if (!POOL_CONTRACT) {
      return NextResponse.json({ error: 'Contracts not configured' }, { status: 500 });
    }

    const rpcServer = new rpc.Server(RPC_URL);
    const pool = new Contract(POOL_CONTRACT);

    // Fetch account sequence from Horizon
    const horizonUrl = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
    const accResponse = await fetch(`${horizonUrl}/accounts/${publicKey}`);
    if (!accResponse.ok) {
      throw new Error(`Failed to fetch account sequence from Horizon: ${accResponse.statusText}`);
    }
    const accJson = await accResponse.json();
    const seq = accJson.sequence || '0';
    const dummyAccount = new Account(publicKey, seq);

    let op;
    if (action === 'add') {
      const aetherStroops = Math.floor(parseFloat(aetherAmt) * 1e7);
      const xlmStroops = Math.floor(parseFloat(xlmAmt) * 1e7);

      op = pool.call(
        'fund_liquidity',
        new Address(publicKey).toScVal(),
        nativeToScVal(aetherStroops, { type: 'i128' }),
        nativeToScVal(xlmStroops, { type: 'i128' })
      );
    } else if (action === 'remove') {
      const shareStroops = Math.floor(parseFloat(lpAmt) * 1e7);

      op = pool.call(
        'reclaim_liquidity',
        new Address(publicKey).toScVal(),
        nativeToScVal(shareStroops, { type: 'i128' })
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let tx = new TransactionBuilder(dummyAccount, {
      fee: '100000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(op)
      .setTimeout(180)
      .build();

    // Simulate and prepare (adds footprint and resolves actual fee)
    tx = await rpcServer.prepareTransaction(tx);

    return NextResponse.json({ xdr: tx.toXDR() });
  } catch (err: any) {
    console.error('Liquidity transaction prepare error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
