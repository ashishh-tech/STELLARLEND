#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Map, vec, Vec};

mod test;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Account(Address), // Stores AccountData for a user
    TotalSupplied,
    TotalBorrowed,
}

#[contracttype]
#[derive(Clone, Debug, Default)]
pub struct AccountData {
    pub supplied: i128,
    pub borrowed: i128,
}

#[contract]
pub struct StellarLend;

#[contractimpl]
impl StellarLend {
    /// Initialize the contract with an admin
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Deposit funds into the lending pool
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();
        let mut data = Self::get_account_data_internal(&env, &user);
        data.supplied += amount;
        env.storage().instance().set(&DataKey::Account(user), &data);
        
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalSupplied).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&DataKey::TotalSupplied, &total);
    }

    /// Withdraw funds from the lending pool
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();
        let mut data = Self::get_account_data_internal(&env, &user);
        if data.supplied < amount {
            panic!("insufficient supplied balance");
        }
        data.supplied -= amount;
        env.storage().instance().set(&DataKey::Account(user), &data);
        
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalSupplied).unwrap_or(0);
        total -= amount;
        env.storage().instance().set(&DataKey::TotalSupplied, &total);
    }

    /// Borrow funds against collateral (simplified: collateral is 100% of supply for demo)
    pub fn borrow(env: Env, user: Address, amount: i128) {
        user.require_auth();
        let mut data = Self::get_account_data_internal(&env, &user);
        
        // Simplified health check: max borrow = 75% of supply
        let max_borrow = (data.supplied * 75) / 100;
        if data.borrowed + amount > max_borrow {
            panic!("insufficient collateral");
        }
        
        data.borrowed += amount;
        env.storage().instance().set(&DataKey::Account(user), &data);
        
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalBorrowed).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&DataKey::TotalBorrowed, &total);
    }

    /// Repay borrowed funds
    pub fn repay(env: Env, user: Address, amount: i128) {
        user.require_auth();
        let mut data = Self::get_account_data_internal(&env, &user);
        if data.borrowed < amount {
            panic!("repaying more than borrowed");
        }
        data.borrowed -= amount;
        env.storage().instance().set(&DataKey::Account(user), &data);
        
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalBorrowed).unwrap_or(0);
        total -= amount;
        env.storage().instance().set(&DataKey::TotalBorrowed, &total);
    }

    /// Get details for a specific user account
    pub fn get_account_data(env: Env, user: Address) -> AccountData {
        Self::get_account_data_internal(&env, &user)
    }

    fn get_account_data_internal(env: &Env, user: &Address) -> AccountData {
        env.storage()
            .instance()
            .get(&DataKey::Account(user.clone()))
            .unwrap_or(AccountData {
                supplied: 0,
                borrowed: 0,
            })
    }
}
