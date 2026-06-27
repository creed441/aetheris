#![cfg(test)]
use super::*;
use aether_token::{AetherToken, AetherTokenClient};
use amm_vault::{AmmVault, AmmVaultClient};
use soroban_sdk::testutils::{Address as _, Events};
use soroban_sdk::{Env, String};

#[test]
fn test_batch_operation() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let bridge_id = env.register_contract(None, OperationsRouter);

    let token_client = AetherTokenClient::new(&env, &token_id);
    let pool_client = AmmVaultClient::new(&env, &pool_id);
    let bridge_client = OperationsRouterClient::new(&env, &bridge_id);

    token_client.setup(
        &admin,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    pool_client.init_vault(&token_id, &token_id, &admin);
    bridge_client.init_router(&token_id, &pool_id, &admin);

    token_client.mint_assets(&admin, &3000);
    pool_client.fund_liquidity(&admin, &1000, &1000);

    let user = Address::generate(&env);
    token_client.mint_assets(&user, &200);

    // Batch operation swaps AETH for XLM (expecting at least 80 out) and takes a 5% fee (10 AETH)
    bridge_client.execute_multi_hop(&user, &100, &80);

    // Verify token balances
    assert_eq!(token_client.shares_of(&user), 186);

    let last_event = env.events().all().last().unwrap();
    assert_eq!(last_event.0, bridge_id);
}

#[test]
#[should_panic]
fn test_zero_amount_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let bridge_id = env.register_contract(None, OperationsRouter);

    let bridge_client = OperationsRouterClient::new(&env, &bridge_id);
    bridge_client.init_router(&token_id, &pool_id, &admin);

    bridge_client.execute_multi_hop(&admin, &0, &0);
}

#[test]
fn test_get_contracts() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let bridge_id = env.register_contract(None, OperationsRouter);
    let bridge_client = OperationsRouterClient::new(&env, &bridge_id);

    bridge_client.init_router(&token_id, &pool_id, &admin);

    let (t, p) = bridge_client.get_linked_contracts();
    assert_eq!(t, token_id);
    assert_eq!(p, pool_id);
}
