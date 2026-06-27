#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Events};
use soroban_sdk::Env;

#[test]
fn test_initialize() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    client.setup(
        &owner,
        &String::from_str(&env, "Aetheris Protocol"),
        &String::from_str(&env, "AETH"),
        &9,
    );

    assert_eq!(client.name(), String::from_str(&env, "Aetheris Protocol"));
    assert_eq!(client.symbol(), String::from_str(&env, "AETH"));
    assert_eq!(client.decimals(), 9);
}

#[test]
fn test_mint() {
    let env = Env::default();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    client.setup(
        &owner,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    client.mint_assets(&user, &1000);

    assert_eq!(client.shares_of(&user), 1000);
    assert_eq!(client.aggregate_supply(), 1000);
}

#[test]
#[should_panic(expected = "HostError: Error(Auth, InvalidAction)")]
fn test_mint_unauthorized() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    client.setup(
        &owner,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    // User tries to mint without owner auth
    client.mint_assets(&user, &1000);
}

#[test]
fn test_transfer_fee() {
    let env = Env::default();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let vault = Address::generate(&env);

    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    client.setup(
        &owner,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    client.update_vault(&vault);

    client.mint_assets(&sender, &1000);
    client.send_assets(&sender, &receiver, &100);

    // Sender: 1000 - 100 = 900
    // Receiver: 100 - (100 * 0.01) = 99
    // Vault: 1
    assert_eq!(client.shares_of(&sender), 900);
    assert_eq!(client.shares_of(&receiver), 99);
    assert_eq!(client.shares_of(&vault), 1);
}

#[test]
fn test_burn() {
    let env = Env::default();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    client.setup(
        &owner,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    client.mint_assets(&user, &1000);
    client.burn_assets(&user, &400);

    assert_eq!(client.shares_of(&user), 600);
    assert_eq!(client.aggregate_supply(), 600);
}

#[test]
fn test_set_treasury() {
    let env = Env::default();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let vault = Address::generate(&env);
    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    client.setup(
        &owner,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    client.update_vault(&vault);
    // Success means no panic
}

#[test]
fn test_events_mint() {
    let env = Env::default();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    client.setup(
        &owner,
        &String::from_str(&env, "A"),
        &String::from_str(&env, "B"),
        &7,
    );
    client.mint_assets(&user, &1000);

    let last_event = env.events().all().last().unwrap();
    assert_eq!(last_event.0, contract_id);
}

#[test]
fn test_balance_zero() {
    let env = Env::default();
    let user = Address::generate(&env);
    let contract_id = env.register_contract(None, AetherToken);
    let client = AetherTokenClient::new(&env, &contract_id);

    // Not initialized yet, but balance should be 0 (default if not found)
    assert_eq!(client.shares_of(&user), 0);
}
