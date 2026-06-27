import { NextResponse } from 'next/server';
import {
  Keypair, Asset, TransactionBuilder, Operation,
  Networks, Horizon,
} from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

// Get secret either from process.env or fallback to reading .env.local directly (for hot-reloading)
let ISSUER_SECRET = process.env.STELLAR_ISSUER_SECRET;
if (!ISSUER_SECRET) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/STELLAR_ISSUER_SECRET=([^\n]+)/);
    if (match) ISSUER_SECRET = match[1].trim();
  } catch (e) {
    console.warn('Could not read .env.local dynamically', e);
  }
}
const HORIZON_URL   = 'https://horizon-testnet.stellar.org';
const ADMIN_WALLETS = [
  'GBD43HIKH233XQ5K2FHCXASYP62243AUONKDRB3G2UTHK3R35PDZBXCX',
  'GCKQMQVZN5A6QMQCVKQ4SX335HLUW4N7ETXK34IOOMZOIQ2TLFF2FNLG',
  'GAV7DLBH6F3P5OU4GD3YVSZZ3DHRXGA2D6ORQBN4XSL63J4WD3H2SUSG',
];

export async function POST(req: Request) {
  try {
    const { recipient, amount, callerPubKey } = await req.json();

    // Faucet mode for testnet: anyone can request test AETH
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }
    if (!ISSUER_SECRET) {
      return NextResponse.json({ error: 'Issuer key not configured' }, { status: 500 });
    }

    const issuerKp    = Keypair.fromSecret(ISSUER_SECRET);
    const aetherAsset    = new Asset('AETH', issuerKp.publicKey());
    const server      = new Horizon.Server(HORIZON_URL);
    const issuerAcct  = await server.loadAccount(issuerKp.publicKey());

    // Build and sign the classic Payment transaction server-side
    const tx = new TransactionBuilder(issuerAcct, {
      fee: '1000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.payment({
        destination: recipient,
        asset: aetherAsset,
        amount: parseFloat(amount).toFixed(7),
      }))
      .setTimeout(180)
      .build();

    tx.sign(issuerKp);

    const result = await server.submitTransaction(tx);
    return NextResponse.json({ hash: (result as any).hash });
  } catch (err: any) {
    const detail = err?.response?.data?.extras?.result_codes || err.message;
    if (detail?.operations?.includes('op_no_trust')) {
      return NextResponse.json({ error: 'Recipient wallet must add a trustline for AETH first.' }, { status: 400 });
    }
    const errorMsg = typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
