#![cfg(test)]
use super::*;
use aether_token::{AetherToken, AetherTokenClient};
use soroban_sdk::testutils::{Address as _, Events};
use soroban_sdk::{Env, String};

#[test]
fn test_add_liquidity() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);

    let pool_client = AmmVaultClient::new(&env, &pool_id);
    let token_client = AetherTokenClient::new(&env, &token_id);

    token_client.setup(
        &admin,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    pool_client.init_vault(&token_id, &token_id, &admin);

    let provider = Address::generate(&env);
    token_client.mint_assets(&provider, &3000);

    pool_client.fund_liquidity(&provider, &1000, &2000);

    let (res_a, res_b) = pool_client.get_vault_reserves();
    assert_eq!(res_a, 1000);
    assert_eq!(res_b, 2000);
}

#[test]
fn test_get_price() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let pool_client = AmmVaultClient::new(&env, &pool_id);

    let token_client = AetherTokenClient::new(&env, &token_id);

    token_client.setup(
        &admin,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    pool_client.init_vault(&token_id, &token_id, &admin);

    env.mock_all_auths();
    token_client.mint_assets(&admin, &3000);
    pool_client.fund_liquidity(&admin, &1000, &2000);

    assert_eq!(pool_client.get_exchange_rate(), 2000);
}

#[test]
fn test_swap_output() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let pool_client = AmmVaultClient::new(&env, &pool_id);
    let token_client = AetherTokenClient::new(&env, &token_id);

    token_client.setup(
        &admin,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    pool_client.init_vault(&token_id, &token_id, &admin);
    token_client.mint_assets(&admin, &3000);
    pool_client.fund_liquidity(&admin, &1000, &1000);

    let user = Address::generate(&env);
    token_client.mint_assets(&user, &100);

    // Swap 100 in, expecting at least 90 out (receives 91 out)
    let out = pool_client.execute_swap(&user, &token_id, &100, &90);
    assert_eq!(out, 91);
}

#[test]
#[should_panic(expected = "slippage limit exceeded")]
fn test_swap_slippage_fail() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let pool_client = AmmVaultClient::new(&env, &pool_id);
    let token_client = AetherTokenClient::new(&env, &token_id);

    token_client.setup(
        &admin,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    pool_client.init_vault(&token_id, &token_id, &admin);
    token_client.mint_assets(&admin, &3000);
    pool_client.fund_liquidity(&admin, &1000, &1000);

    let user = Address::generate(&env);
    token_client.mint_assets(&user, &100);

    // Swap 100 in, expecting at least 95 out, but constant product gives 91 out (should panic!)
    pool_client.execute_swap(&user, &token_id, &100, &95);
}

#[test]
fn test_remove_liquidity() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let pool_client = AmmVaultClient::new(&env, &pool_id);
    let token_client = AetherTokenClient::new(&env, &token_id);

    token_client.setup(
        &admin,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    pool_client.init_vault(&token_id, &token_id, &admin);

    token_client.mint_assets(&admin, &3000);
    pool_client.fund_liquidity(&admin, &1000, &1000);
    pool_client.reclaim_liquidity(&admin, &500);

    let (res_a, res_b) = pool_client.get_vault_reserves();
    assert_eq!(res_a, 500);
    assert_eq!(res_b, 500);
}

#[test]
fn test_swap_event() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, AetherToken);
    let pool_id = env.register_contract(None, AmmVault);
    let pool_client = AmmVaultClient::new(&env, &pool_id);
    let token_client = AetherTokenClient::new(&env, &token_id);

    token_client.setup(
        &admin,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    pool_client.init_vault(&token_id, &token_id, &admin);
    token_client.mint_assets(&admin, &3000);
    pool_client.fund_liquidity(&admin, &1000, &1000);

    pool_client.execute_swap(&admin, &token_id, &100, &0);

    let last_event = env.events().all().last().unwrap();
    assert_eq!(last_event.0, pool_id);
}
