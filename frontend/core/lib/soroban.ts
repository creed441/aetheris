import { 
  TransactionBuilder, 
  Networks, 
  Contract, 
  rpc, 
  nativeToScVal, 
  Address,
  BASE_FEE,
  Horizon,
  xdr,
  Operation,
  StrKey
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export async function signAndSubmit(publicKey: string, operation: any) {
  const server = new rpc.Server(RPC_URL);
  const horizon = new Horizon.Server(HORIZON_URL);
  
  // 1. Load account
  const account = await horizon.loadAccount(publicKey);

  // 2. Build Transaction
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  // 3. Simulate and Prepare
  tx = await server.prepareTransaction(tx);

  // 4. Sign with Freighter
  const signedResult = await signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedXDR = typeof signedResult === 'string' 
    ? signedResult 
    : (signedResult as { signedTxXdr?: string })?.signedTxXdr;

  if (!signedXDR) throw new Error('Signing failed or rejected by user');

  // 5. Submit
  // We use a raw fetch here to bypass a known SDK bug where re-serializing 
  // a parsed signed transaction can throw "Bad union switch: 4" (SCV_SYMBOL).
  const rpcRes = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'sendTransaction',
      params: {
        transaction: signedXDR
      }
    })
  });

  const json = await rpcRes.json();
  if (json.error) {
    throw new Error(`RPC Error: ${json.error.message || JSON.stringify(json.error)}`);
  }

  const response = json.result;
  if (response.status === 'ERROR') {
    throw new Error(`Transaction failed: ${JSON.stringify(response.errorResultXdr)}`);
  }

  // 6. Safe Polling
  let status = 'PENDING';
  while (status === 'PENDING' || status === 'NOT_FOUND') {
    await new Promise(r => setTimeout(r, 1000));
    const pollRes = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'getTransaction',
        params: { hash: response.hash }
      })
    });
    const pollJson = await pollRes.json();
    if (pollJson.result) {
      status = pollJson.result.status;
      if (status === 'FAILED') {
        throw new Error('Transaction failed on-chain');
      }
    }
  }

  return response.hash;
}

const DUMMY_ID = 'CCQZXG3QGFPLRS6LJJ4XALJGUGVNLISYN6BJSVOH57ED6FYJH7KGKXAR';
export const ammVaultContract = new Contract(process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || DUMMY_ID);
export const aetherContract = new Contract(process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || DUMMY_ID);
export const XLM_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export { nativeToScVal, Address, xdr, TransactionBuilder, Networks, rpc, Horizon, BASE_FEE, Operation, StrKey };
