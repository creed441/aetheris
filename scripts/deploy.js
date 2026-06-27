/**
 * scripts/deploy.js
 *
 * Full Aetheris Protocol deployment script.
 * Covers: fund → deploy → initialize → mint → fund_liquidity → save record.
 *
 * Usage:
 *   STELLAR_ISSUER_SECRET=S... STELLAR_DISTRIBUTOR_SECRET=S... node scripts/deploy.js
 */

'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const https = require('https');
const { Keypair } = require('@stellar/stellar-sdk');

// ─── ENV ──────────────────────────────────────────────────────────────────────
const ISSUER_SECRET      = process.env.STELLAR_ISSUER_SECRET;
const DISTRIBUTOR_SECRET = process.env.STELLAR_DISTRIBUTOR_SECRET;
const RPC_URL   = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const HORIZON   = process.env.HORIZON_URL     || 'https://horizon-testnet.stellar.org';
const NETWORK   = 'testnet';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

if (!ISSUER_SECRET || !DISTRIBUTOR_SECRET) {
  console.error('\n[ERROR] Set STELLAR_ISSUER_SECRET and STELLAR_DISTRIBUTOR_SECRET\n');
  process.exit(1);
}

const issuerKp      = Keypair.fromSecret(ISSUER_SECRET);
const distributorKp = Keypair.fromSecret(DISTRIBUTOR_SECRET);
const ISSUER_PUB      = issuerKp.publicKey();
const DISTRIBUTOR_PUB = distributorKp.publicKey();

const WASM_DIR    = path.join(__dirname, '..', 'contracts', 'target', 'wasm32-unknown-unknown', 'release');
const DEPLOY_DIR  = path.join(__dirname, '..', 'deployments');
const DEPLOY_FILE = path.join(DEPLOY_DIR, 'testnet.json');

if (!fs.existsSync(DEPLOY_DIR)) fs.mkdirSync(DEPLOY_DIR, { recursive: true });

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const log  = (msg) => console.log(`\n  ${msg}`);
const ok   = (msg) => console.log(`  ✓  ${msg}`);
const fail = (msg) => { console.error(`  ✗  ${msg}`); process.exit(1); };

/** Run a shell command and return trimmed stdout. */
function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
  } catch (e) {
    throw new Error(e.stderr || e.message);
  }
}

/** HTTP GET → parsed JSON. */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(body); }
      });
    }).on('error', reject);
  });
}

/** Get XLM balance for a public key via Horizon. */
async function getXlmBalance(pubKey) {
  try {
    const acc = await httpGet(`${HORIZON}/accounts/${pubKey}`);
    const native = (acc.balances || []).find((b) => b.asset_type === 'native');
    return parseFloat(native?.balance || '0');
  } catch {
    return 0;
  }
}

/** Stellar CLI shorthand. */
function soroban(subCmd) {
  const cmd = `./bin/stellar --no-cache ${subCmd}`;
  return run(cmd, {
    env: {
      ...process.env,
      STELLAR_NETWORK: NETWORK,
      STELLAR_RPC_URL: RPC_URL,
      STELLAR_NETWORK_PASSPHRASE: NETWORK_PASSPHRASE,
    }
  });
}

/** Deploy a WASM file and return contract ID. */
function deployWasm(wasmPath, sourceSecret) {
  try { execSync('sleep 18'); } catch (e) {}
  return soroban(
    `contract deploy --wasm "${wasmPath}" --source ${sourceSecret} --fee 10000`
  );
}

/** Invoke a contract function and return stdout (tx hash or result). */
function invoke(contractId, sourceSecret, fn, args = '') {
  try { execSync('sleep 18'); } catch (e) {}
  return soroban(
    `contract invoke --id ${contractId} --source ${sourceSecret} --fee 10000 -- ${fn} ${args}`
  );
}

// ─── STEP 1 — Fund accounts via Friendbot ────────────────────────────────────
async function step1_fund() {
  console.log('\n═══ STEP 1 — Fund accounts via Friendbot ═══');

  for (const [label, pubKey] of [['Issuer', ISSUER_PUB], ['Distributor', DISTRIBUTOR_PUB]]) {
    const bal = await getXlmBalance(pubKey);
    if (bal >= 10) {
      ok(`${label} (${pubKey.slice(0,6)}…) already has ${bal.toFixed(2)} XLM — skipping`);
      continue;
    }
    log(`Funding ${label} via Friendbot…`);
    try {
      const res = await httpGet(`https://friendbot.stellar.org?addr=${pubKey}`);
      if (res.hash) {
        ok(`${label} funded — tx: ${res.hash}`);
      } else {
        ok(`${label} funded`);
      }
    } catch (e) {
      fail(`Friendbot failed for ${label}: ${e.message}`);
    }
    // Wait for ledger
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// ─── STEP 2 — Mint Classic AETH via Trustline Script ────────────────────────
async function step2_mint_classic() {
  console.log('\n═══ STEP 2 — Mint Classic AETH ═══');
  log('Running setup-trustlines.js to mint classic AETH to Distributor…');
  try {
    const output = run('node scripts/setup-trustlines.js');
    console.log(output);
    ok('Classic AETH Minted successfully.');
  } catch (e) {
    fail(`Classic mint failed: ${e.message}`);
  }
}

// ─── STEP 3 — Deploy contracts ────────────────────────────────────────────────
function step3_deploy() {
  console.log('\n═══ STEP 3 — Deploy Soroban contracts ═══');

  // Deploy SAC for AETH
  log(`Deploying SAC Wrapper for AETH:${ISSUER_PUB}…`);
  let agtId;
  try {
    agtId = soroban(`contract asset deploy --asset AETH:${ISSUER_PUB} --source-account ${ISSUER_SECRET}`);
    ok(`AETH SAC deployed → ${agtId}`);
  } catch (e) {
    if (e.message.includes('ExistingValue')) {
      agtId = soroban(`contract id asset --asset AETH:${ISSUER_PUB}`).trim();
      ok(`AETH SAC already exists → ${agtId}`);
    } else {
      fail(`SAC deploy failed: ${e.message}`);
    }
  }

  const ids = { 'AETH Token': agtId };

  // Deploy AMM Vault (Issuer)
  const vaultWasm = path.join(WASM_DIR, 'amm_vault.optimized.wasm');
  if (!fs.existsSync(vaultWasm)) {
    fail(`WASM not found: ${vaultWasm}\nRun: make build-contracts`);
  }
  log(`Deploying AMM Vault from ${path.basename(vaultWasm)}…`);
  try {
    const contractId = deployWasm(vaultWasm, ISSUER_SECRET);
    ok(`AMM Vault → ${contractId}`);
    ids['AMM Vault'] = contractId;
  } catch (e) {
    fail(`Deploy failed for AMM Vault: ${e.message}`);
  }

  // Deploy Operations Router (Distributor)
  const routerWasm = path.join(WASM_DIR, 'operations_router.optimized.wasm');
  if (!fs.existsSync(routerWasm)) {
    fail(`WASM not found: ${routerWasm}\nRun: make build-contracts`);
  }
  log(`Deploying Operations Router from ${path.basename(routerWasm)}…`);
  try {
    const contractId = deployWasm(routerWasm, DISTRIBUTOR_SECRET);
    ok(`Operations Router → ${contractId}`);
    ids['Operations Router'] = contractId;
  } catch (e) {
    fail(`Deploy failed for Operations Router: ${e.message}`);
  }

  return {
    agtId:    ids['AETH Token'],
    poolId:   ids['AMM Vault'],
    bridgeId: ids['Operations Router'],
  };
}

// ─── STEP 4 — Initialize contracts ───────────────────────────────────────────
function step4_initialize(agtId, poolId, bridgeId) {
  console.log('\n═══ STEP 4 — Initialize contracts ═══');
  const hashes = {};

  hashes.agtInit = 'SAC wrappers do not require initialization';
  ok('AETH SAC ready.');

  // AMM Vault
  log('Initializing AMM Vault…');
  try {
    const XLM_CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // native testnet XLM
    hashes.poolInit = invoke(poolId, ISSUER_SECRET, 'init_vault',
      `--asset_x ${agtId} --asset_y ${XLM_CONTRACT_ID} --manager ${ISSUER_PUB}`
    );
    ok(`AMM Vault initialized — ${hashes.poolInit}`);
  } catch (e) {
    fail(`AMM Vault init failed: ${e.message}`);
  }

  // Operations Router
  log('Initializing Operations Router…');
  try {
    hashes.bridgeInit = invoke(bridgeId, DISTRIBUTOR_SECRET, 'init_router',
      `--token_contract ${agtId} --pool_contract ${poolId} --owner ${ISSUER_PUB}`
    );
    ok(`Operations Router initialized — ${hashes.bridgeInit}`);
  } catch (e) {
    fail(`Operations Router init failed: ${e.message}`);
  }

  return hashes;
}

// ─── STEP 5 — Add initial liquidity ──────────────────────────────────────────
function step5_liquidity(poolId) {
  console.log('\n═══ STEP 5 — Add initial liquidity ═══');
  // 100,000 AETH (×10^7) and 4,000 XLM (×10^7)
  const TOKEN_AMT = '1000000000000';  // 100,000 AETH
  const XLM_AMT   = '40000000000';    // 4,000 XLM

  log(`Adding liquidity: ${TOKEN_AMT} AETH stroops + ${XLM_AMT} XLM stroops…`);
  try {
    const txHash = invoke(poolId, DISTRIBUTOR_SECRET, 'fund_liquidity',
      `--provider ${DISTRIBUTOR_PUB} --amount_x ${TOKEN_AMT} --amount_y ${XLM_AMT}`
    );
    ok(`Liquidity added — ${txHash}`);
    return txHash;
  } catch (e) {
    fail(`Add liquidity failed: ${e.message}`);
  }
}

// ─── STEP 6 — Save deployment record ─────────────────────────────────────────
function step6_save(data) {
  console.log('\n═══ STEP 6 — Save deployment record ═══');

  const record = {
    network: 'testnet',
    deployedAt: new Date().toISOString(),
    issuerPublicKey: ISSUER_PUB,
    distributorPublicKey: DISTRIBUTOR_PUB,
    agtAsset: `AETH:${ISSUER_PUB}`,
    AETHToken: {
      contractId: data.agtId,
      wasmHash: data.agtWasmHash || '',
      initTxHash: data.agtInit || '',
    },
    AmmVault: {
      contractId: data.poolId,
      wasmHash: data.poolWasmHash || '',
      initTxHash: data.poolInit || '',
    },
    OperationsRouter: {
      contractId: data.bridgeId,
      wasmHash: data.bridgeWasmHash || '',
      initTxHash: data.bridgeInit || '',
    },
    trustline: {
      asset: 'AETH',
      issuer: ISSUER_PUB,
      limit: '1000000',
      setupTxHash: data.trustlineSetupTxHash || '',
    },
  };

  fs.writeFileSync(DEPLOY_FILE, JSON.stringify(record, null, 2));
  ok(`Record saved → ${DEPLOY_FILE}`);
  return record;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Aetheris Protocol — Full Deploy           ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n  Issuer:      ${ISSUER_PUB}`);
  console.log(`  Distributor: ${DISTRIBUTOR_PUB}`);
  console.log(`  Network:     ${NETWORK} (${RPC_URL})`);

  await step1_fund();
  await step2_mint_classic();

  const { agtId, poolId, bridgeId } = step3_deploy();
  const { agtInit, poolInit, bridgeInit } = step4_initialize(agtId, poolId, bridgeId);
  const lpTxHash    = step5_liquidity(poolId);

  const record = step6_save({
    agtId, poolId, bridgeId,
    agtInit, poolInit, bridgeInit,
    mintTxHash: 'Minted via setup-trustlines.js',
    lpTxHash,
  });

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Deployment complete! 🚀                  ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  AETH Token: ${record.AETHToken.contractId.padEnd(30)} ║`);
  console.log(`║  AMM Vault:  ${record.AmmVault.contractId.padEnd(30)} ║`);
  console.log(`║  Router:     ${record.OperationsRouter.contractId.padEnd(30)} ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n  Next steps:');
  console.log('  1. Copy contract IDs into frontend/.env.local');
  console.log('  2. Run: node scripts/setup-trustlines.js');
  console.log('  3. Run: cd frontend && npm run dev\n');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
