#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, Symbol};

#[cfg(test)]
mod test;

#[contracttype]
#[derive(Clone)]
#[allow(clippy::enum_variant_names)]
enum DataKey {
    TokenRef,
    PoolRef,
    OwnerRef,
}

#[contract]
pub struct OperationsRouter;

#[contractimpl]
impl OperationsRouter {
    pub fn init_router(env: Env, token_contract: Address, pool_contract: Address, owner: Address) {
        if env.storage().instance().has(&DataKey::OwnerRef) {
            panic!("already initialized");
        }
        env.storage()
            .instance()
            .set(&DataKey::TokenRef, &token_contract);
        env.storage()
            .instance()
            .set(&DataKey::PoolRef, &pool_contract);
        env.storage().instance().set(&DataKey::OwnerRef, &owner);
    }

    pub fn execute_multi_hop(env: Env, user: Address, amount: i128, min_amount_out: i128) {
        user.require_auth();

        let token_contract: Address = env.storage().instance().get(&DataKey::TokenRef).unwrap();
        let pool_contract: Address = env.storage().instance().get(&DataKey::PoolRef).unwrap();
        let owner: Address = env.storage().instance().get(&DataKey::OwnerRef).unwrap();

        // 1. Call pool.execute_swap()
        // Swapping AETH for XLM (token_contract is AssetX, pool expects user, token_in, amount_in, min_amount_out)
        let _amount_out: i128 = env.invoke_contract(
            &pool_contract,
            &Symbol::new(&env, "execute_swap"),
            (user.clone(), token_contract.clone(), amount, min_amount_out).into_val(&env),
        );

        // 2. Call token.transfer()
        // Sending a 5% service fee in AETH from user to owner (using standard transfer call)
        let fee = amount / 20;
        if fee > 0 {
            env.invoke_contract::<()>(
                &token_contract,
                &Symbol::new(&env, "transfer"),
                (user.clone(), owner.clone(), fee).into_val(&env),
            );
        }

        env.events()
            .publish((Symbol::new(&env, "BatchExecuted"), user), amount);
    }

    pub fn get_linked_contracts(env: Env) -> (Address, Address) {
        let token_contract: Address = env.storage().instance().get(&DataKey::TokenRef).unwrap();
        let pool_contract: Address = env.storage().instance().get(&DataKey::PoolRef).unwrap();
        (token_contract, pool_contract)
    }
}
