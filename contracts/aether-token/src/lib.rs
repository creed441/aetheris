#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

#[cfg(test)]
mod test;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Owner,
    Vault,
    ShareBalance(Address),
    TotalMinted,
    Name,
    Symbol,
    Decimals,
}

#[contract]
pub struct AetherToken;

#[contractimpl]
impl AetherToken {
    pub fn setup(env: Env, owner: Address, name: String, symbol: String, decimals: u32) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Vault, &owner); // Default vault to owner
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::TotalMinted, &0i128);
    }

    pub fn update_vault(env: Env, vault: Address) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();
        env.storage().instance().set(&DataKey::Vault, &vault);
    }

    pub fn mint_assets(env: Env, to: Address, amount: i128) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();

        let balance = Self::shares_of(env.clone(), to.clone());
        env.storage()
            .persistent()
            .set(&DataKey::ShareBalance(to.clone()), &(balance + amount));

        let total_supply = Self::aggregate_supply(env.clone());
        env.storage()
            .instance()
            .set(&DataKey::TotalMinted, &(total_supply + amount));

        env.events().publish((symbol_short!("mint"), to), amount);
    }

    pub fn burn_assets(env: Env, from: Address, amount: i128) {
        from.require_auth();

        let balance = Self::shares_of(env.clone(), from.clone());
        if balance < amount {
            panic!("insufficient balance");
        }
        env.storage()
            .persistent()
            .set(&DataKey::ShareBalance(from.clone()), &(balance - amount));

        let total_supply = Self::aggregate_supply(env.clone());
        env.storage()
            .instance()
            .set(&DataKey::TotalMinted, &(total_supply - amount));

        env.events().publish((symbol_short!("burn"), from), amount);
    }

    pub fn send_assets(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        let balance_from = Self::shares_of(env.clone(), from.clone());
        if balance_from < amount {
            panic!("insufficient balance");
        }

        let fee = amount / 100; // 1% fee
        let amount_after_fee = amount - fee;
        let vault: Address = env.storage().instance().get(&DataKey::Vault).unwrap();

        // Update sender balance
        env.storage().persistent().set(
            &DataKey::ShareBalance(from.clone()),
            &(balance_from - amount),
        );

        // Update receiver balance
        let balance_to = Self::shares_of(env.clone(), to.clone());
        env.storage().persistent().set(
            &DataKey::ShareBalance(to.clone()),
            &(balance_to + amount_after_fee),
        );

        // Update vault balance
        if fee > 0 {
            let balance_vault = Self::shares_of(env.clone(), vault.clone());
            env.storage().persistent().set(
                &DataKey::ShareBalance(vault.clone()),
                &(balance_vault + fee),
            );

            env.events()
                .publish((Symbol::new(&env, "FeeCollected"), vault), fee);
        }

        env.events()
            .publish((symbol_short!("transfer"), from, to), amount_after_fee);
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        Self::send_assets(env, from, to, amount);
    }

    pub fn shares_of(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::ShareBalance(id))
            .unwrap_or(0)
    }

    pub fn aggregate_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalMinted)
            .unwrap_or(0)
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap()
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }
}
