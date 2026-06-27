#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, IntoVal, Symbol,
};

#[cfg(test)]
mod test;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    AssetX, // Target custom token AETH
    AssetY, // Native XLM token wrapper
    Manager,
    PoolReserveX,
    PoolReserveY,
    OutstandingShares,
    ShareLedger(Address),
}

#[contract]
pub struct AmmVault;

#[contractimpl]
impl AmmVault {
    /// Initializes the vault with target assets and manager.
    pub fn init_vault(env: Env, asset_x: Address, asset_y: Address, manager: Address) {
        if env.storage().instance().has(&DataKey::Manager) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::AssetX, &asset_x);
        env.storage().instance().set(&DataKey::AssetY, &asset_y);
        env.storage().instance().set(&DataKey::Manager, &manager);
        env.storage().instance().set(&DataKey::PoolReserveX, &0i128);
        env.storage().instance().set(&DataKey::PoolReserveY, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::OutstandingShares, &0i128);
    }

    /// Deposits liquidity into the pool.
    pub fn fund_liquidity(env: Env, provider: Address, amount_x: i128, amount_y: i128) {
        provider.require_auth();

        let asset_x: Address = env.storage().instance().get(&DataKey::AssetX).unwrap();
        let asset_y: Address = env.storage().instance().get(&DataKey::AssetY).unwrap();

        // Transfer AssetX from provider to pool
        env.invoke_contract::<()>(
            &asset_x,
            &Symbol::new(&env, "transfer"),
            (provider.clone(), env.current_contract_address(), amount_x).into_val(&env),
        );

        // Transfer AssetY from provider to pool
        env.invoke_contract::<()>(
            &asset_y,
            &Symbol::new(&env, "transfer"),
            (provider.clone(), env.current_contract_address(), amount_y).into_val(&env),
        );

        let reserve_x: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveX)
            .unwrap();
        let reserve_y: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveY)
            .unwrap();

        let shares_to_mint = if reserve_x == 0 {
            amount_x // Initial liquidity
        } else {
            (amount_x * 100) / reserve_x
        };

        env.storage()
            .instance()
            .set(&DataKey::PoolReserveX, &(reserve_x + amount_x));
        env.storage()
            .instance()
            .set(&DataKey::PoolReserveY, &(reserve_y + amount_y));

        let total_shares: i128 = env
            .storage()
            .instance()
            .get(&DataKey::OutstandingShares)
            .unwrap();
        env.storage().instance().set(
            &DataKey::OutstandingShares,
            &(total_shares + shares_to_mint),
        );

        let balance = env
            .storage()
            .persistent()
            .get(&DataKey::ShareLedger(provider.clone()))
            .unwrap_or(0);
        env.storage().persistent().set(
            &DataKey::ShareLedger(provider.clone()),
            &(balance + shares_to_mint),
        );

        env.events().publish(
            (Symbol::new(&env, "LiquidityAdded"), provider),
            (amount_x, amount_y),
        );
    }

    /// Reclaims liquidity from the vault based on pool shares.
    pub fn reclaim_liquidity(env: Env, provider: Address, share_amount: i128) {
        provider.require_auth();

        let balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::ShareLedger(provider.clone()))
            .unwrap_or(0);
        if balance < share_amount {
            panic!("insufficient LP balance");
        }

        let total_shares: i128 = env
            .storage()
            .instance()
            .get(&DataKey::OutstandingShares)
            .unwrap();
        let reserve_x: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveX)
            .unwrap();
        let reserve_y: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveY)
            .unwrap();

        let amount_x = (share_amount * reserve_x) / total_shares;
        let amount_y = (share_amount * reserve_y) / total_shares;

        let asset_x: Address = env.storage().instance().get(&DataKey::AssetX).unwrap();
        let asset_y: Address = env.storage().instance().get(&DataKey::AssetY).unwrap();

        // Transfer AssetX back to provider
        env.invoke_contract::<()>(
            &asset_x,
            &Symbol::new(&env, "transfer"),
            (env.current_contract_address(), provider.clone(), amount_x).into_val(&env),
        );

        // Transfer AssetY back to provider
        env.invoke_contract::<()>(
            &asset_y,
            &Symbol::new(&env, "transfer"),
            (env.current_contract_address(), provider.clone(), amount_y).into_val(&env),
        );

        env.storage()
            .instance()
            .set(&DataKey::PoolReserveX, &(reserve_x - amount_x));
        env.storage()
            .instance()
            .set(&DataKey::PoolReserveY, &(reserve_y - amount_y));
        env.storage()
            .instance()
            .set(&DataKey::OutstandingShares, &(total_shares - share_amount));
        env.storage().persistent().set(
            &DataKey::ShareLedger(provider.clone()),
            &(balance - share_amount),
        );

        env.events().publish(
            (Symbol::new(&env, "LiquidityRemoved"), provider),
            (amount_x, amount_y),
        );
    }

    /// Performs an automated market maker swap with slippage protection (Spec C).
    pub fn execute_swap(
        env: Env,
        user: Address,
        token_in: Address,
        amount_in: i128,
        min_amount_out: i128,
    ) -> i128 {
        user.require_auth();

        let asset_x: Address = env.storage().instance().get(&DataKey::AssetX).unwrap();
        let asset_y: Address = env.storage().instance().get(&DataKey::AssetY).unwrap();
        let reserve_x: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveX)
            .unwrap();
        let reserve_y: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveY)
            .unwrap();

        let (amount_out, new_res_x, new_res_y) = if token_in == asset_x {
            // Swap AssetX for AssetY
            let k = reserve_x * reserve_y;
            let new_reserve_x = reserve_x + amount_in;
            let new_reserve_y = k / new_reserve_x;
            let out = reserve_y - new_reserve_y;

            if out < min_amount_out {
                panic!("slippage limit exceeded");
            }

            // Transfer AssetX in
            env.invoke_contract::<()>(
                &asset_x,
                &Symbol::new(&env, "transfer"),
                (user.clone(), env.current_contract_address(), amount_in).into_val(&env),
            );

            // Transfer AssetY out
            env.invoke_contract::<()>(
                &asset_y,
                &Symbol::new(&env, "transfer"),
                (env.current_contract_address(), user.clone(), out).into_val(&env),
            );

            (out, new_reserve_x, new_reserve_y)
        } else {
            // Swap AssetY for AssetX
            let k = reserve_x * reserve_y;
            let new_reserve_y = reserve_y + amount_in;
            let new_reserve_x = k / new_reserve_y;
            let out = reserve_x - new_reserve_x;

            if out < min_amount_out {
                panic!("slippage limit exceeded");
            }

            // Transfer AssetY in
            env.invoke_contract::<()>(
                &asset_y,
                &Symbol::new(&env, "transfer"),
                (user.clone(), env.current_contract_address(), amount_in).into_val(&env),
            );

            // Transfer AssetX out
            env.invoke_contract::<()>(
                &asset_x,
                &Symbol::new(&env, "transfer"),
                (env.current_contract_address(), user.clone(), out).into_val(&env),
            );

            (out, new_reserve_x, new_reserve_y)
        };

        env.storage()
            .instance()
            .set(&DataKey::PoolReserveX, &new_res_x);
        env.storage()
            .instance()
            .set(&DataKey::PoolReserveY, &new_res_y);

        env.events()
            .publish((symbol_short!("swap"), user), (amount_in, amount_out));

        amount_out
    }

    /// Returns the current exchange rate (multiplied by 1000).
    pub fn get_exchange_rate(env: Env) -> i128 {
        let reserve_x: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveX)
            .unwrap();
        let reserve_y: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveY)
            .unwrap();
        if reserve_x == 0 {
            0
        } else {
            (reserve_y * 1000) / reserve_x
        }
    }

    /// Returns vault reserve weights.
    pub fn get_vault_reserves(env: Env) -> (i128, i128) {
        let reserve_x: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveX)
            .unwrap();
        let reserve_y: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolReserveY)
            .unwrap();
        (reserve_x, reserve_y)
    }
}
