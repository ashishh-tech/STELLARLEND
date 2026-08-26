#![no_std]
#![allow(deprecated)]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

mod test;

// ── Constants & Storage TTL Limits ───────────────────────────────────────────
// Soroban Best Practice: Persistent entries must have their TTL extended to prevent expiration.
// 1 ledger ~= 5 seconds. 17,280 ledgers ~= 1 day. 518,400 ledgers ~= 30 days.
pub const DAY_IN_LEDGERS: u32 = 17_280;
pub const MIN_PERSISTENT_TTL: u32 = DAY_IN_LEDGERS * 7; // 7 days min threshold
pub const EXTEND_PERSISTENT_TTL: u32 = DAY_IN_LEDGERS * 30; // Extend to 30 days

pub const MIN_INSTANCE_TTL: u32 = DAY_IN_LEDGERS * 7;
pub const EXTEND_INSTANCE_TTL: u32 = DAY_IN_LEDGERS * 30;

pub const BPS_SCALING: i128 = 10_000; // 100% = 10,000 bps

// ── Error Codes ──────────────────────────────────────────────────────────────
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ContractPaused = 4,
    InvalidAmount = 5,
    InsufficientSupplied = 6,
    InsufficientCollateral = 7,
    RepayingMoreThanBorrowed = 8,
    PositionHealthy = 9,
    ReserveAlreadyExists = 10,
    ReserveNotFound = 11,
    MathOverflow = 12,
}

// ── Data Types & Storage Keys ────────────────────────────────────────────────
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Paused,
    ReserveList,
    // Per-asset Reserve configuration and state (stored in instance / persistent)
    Reserve(Address),
    // Isolated per-user persistent storage keys (Scalable Architecture)
    UserAccount(Address),
    UserPosition(Address, Address), // (User, Token)
    // Backward-compatibility aggregate trackers
    TotalSupplied,
    TotalBorrowed,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct AccountData {
    pub supplied: i128,
    pub borrowed: i128,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct UserPosition {
    pub supplied: i128,
    pub borrowed: i128,
    pub last_accrued_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ReserveData {
    pub token: Address,
    pub total_supplied: i128,
    pub total_borrowed: i128,
    pub supply_index: i128,
    pub borrow_index: i128,
    pub last_update_ledger: u32,
    pub ltv_bps: u32,                  // e.g. 7500 for 75%
    pub liquidation_threshold_bps: u32,// e.g. 8000 for 80%
    pub liquidation_bonus_bps: u32,    // e.g. 500 for 5%
    pub base_rate_bps: u32,            // e.g. 200 for 2%
    pub slope_rate_bps: u32,           // e.g. 800 for 8%
    pub price: i128,                   // Price in USD with 7 decimals (1.0 = 10_000_000)
}

// ── Contract Implementation ──────────────────────────────────────────────────
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
        env.storage().instance().set(&DataKey::Paused, &false);
        let empty_list: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&DataKey::ReserveList, &empty_list);
        Self::extend_instance_ttl(&env);
    }

    /// Admin: Set protocol pause state
    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&DataKey::Paused, &paused);
        env.events().publish((symbol_short!("pause_set"), admin), paused);
    }

    /// Admin: Initialize a multi-asset reserve market with risk & interest parameters
    pub fn init_reserve(
        env: Env,
        admin: Address,
        token: Address,
        ltv_bps: u32,
        liquidation_threshold_bps: u32,
        liquidation_bonus_bps: u32,
        base_rate_bps: u32,
        slope_rate_bps: u32,
        initial_price: i128,
    ) {
        Self::require_admin(&env, &admin);

        let reserve_key = DataKey::Reserve(token.clone());
        if env.storage().persistent().has(&reserve_key) {
            panic!("reserve already exists");
        }

        let reserve = ReserveData {
            token: token.clone(),
            total_supplied: 0,
            total_borrowed: 0,
            supply_index: BPS_SCALING,
            borrow_index: BPS_SCALING,
            last_update_ledger: env.ledger().sequence(),
            ltv_bps,
            liquidation_threshold_bps,
            liquidation_bonus_bps,
            base_rate_bps,
            slope_rate_bps,
            price: initial_price,
        };

        env.storage().persistent().set(&reserve_key, &reserve);
        Self::extend_persistent_ttl(&env, &reserve_key);

        let mut reserves: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::ReserveList)
            .unwrap_or_else(|| Vec::new(&env));
        reserves.push_back(token.clone());
        env.storage().instance().set(&DataKey::ReserveList, &reserves);

        Self::extend_instance_ttl(&env);
        env.events().publish((symbol_short!("res_init"), token), initial_price);
    }

    /// Admin / Oracle: Update asset price (in USD with 7 decimals)
    pub fn set_asset_price(env: Env, admin: Address, token: Address, price: i128) {
        Self::require_admin(&env, &admin);
        let reserve_key = DataKey::Reserve(token.clone());
        let mut reserve: ReserveData = env
            .storage()
            .persistent()
            .get(&reserve_key)
            .expect("reserve not found");
        reserve.price = price;
        env.storage().persistent().set(&reserve_key, &reserve);
        Self::extend_persistent_ttl(&env, &reserve_key);
        env.events().publish((symbol_short!("price_upd"), token), price);
    }

    // ── Multi-Asset Scalable Lending Engine ───────────────────────────────────

    /// Deposit multi-asset collateral into the protocol
    pub fn deposit_asset(env: Env, user: Address, token: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        // Accrue interest for the reserve
        Self::accrue_interest_internal(&env, &token);

        // Perform real token transfer from user to contract if token client is active
        let client = token::Client::new(&env, &token);
        client.transfer(&user, &env.current_contract_address(), &amount);

        // Update user persistent storage position
        let pos_key = DataKey::UserPosition(user.clone(), token.clone());
        let mut user_pos = env
            .storage()
            .persistent()
            .get(&pos_key)
            .unwrap_or(UserPosition {
                supplied: 0,
                borrowed: 0,
                last_accrued_ledger: env.ledger().sequence(),
            });
        user_pos.supplied += amount;
        env.storage().persistent().set(&pos_key, &user_pos);
        Self::extend_persistent_ttl(&env, &pos_key);

        // Update reserve pool totals
        let res_key = DataKey::Reserve(token.clone());
        let mut reserve: ReserveData = env
            .storage()
            .persistent()
            .get(&res_key)
            .expect("reserve not found");
        reserve.total_supplied += amount;
        env.storage().persistent().set(&res_key, &reserve);
        Self::extend_persistent_ttl(&env, &res_key);

        env.events().publish((symbol_short!("deposit"), user, token), amount);
    }

    /// Withdraw supplied asset from the protocol
    pub fn withdraw_asset(env: Env, user: Address, token: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        Self::accrue_interest_internal(&env, &token);

        let pos_key = DataKey::UserPosition(user.clone(), token.clone());
        let mut user_pos: UserPosition = env
            .storage()
            .persistent()
            .get(&pos_key)
            .expect("position not found");

        if user_pos.supplied < amount {
            panic!("insufficient supplied balance");
        }

        user_pos.supplied -= amount;
        env.storage().persistent().set(&pos_key, &user_pos);
        Self::extend_persistent_ttl(&env, &pos_key);

        // Check health factor after withdrawal if user has active borrows
        let hf = Self::get_health_factor_internal(&env, &user);
        if hf < BPS_SCALING as u32 && hf != 0 {
            panic!("withdrawal causes undercollateralization");
        }

        let res_key = DataKey::Reserve(token.clone());
        let mut reserve: ReserveData = env
            .storage()
            .persistent()
            .get(&res_key)
            .expect("reserve not found");
        reserve.total_supplied -= amount;
        env.storage().persistent().set(&res_key, &reserve);
        Self::extend_persistent_ttl(&env, &res_key);

        // Transfer tokens back to user
        let client = token::Client::new(&env, &token);
        client.transfer(&env.current_contract_address(), &user, &amount);

        env.events().publish((symbol_short!("withdraw"), user, token), amount);
    }

    /// Borrow asset against supplied collateral
    pub fn borrow_asset(env: Env, user: Address, token: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        Self::accrue_interest_internal(&env, &token);

        let res_key = DataKey::Reserve(token.clone());
        let mut reserve: ReserveData = env
            .storage()
            .persistent()
            .get(&res_key)
            .expect("reserve not found");

        let pos_key = DataKey::UserPosition(user.clone(), token.clone());
        let mut user_pos = env
            .storage()
            .persistent()
            .get(&pos_key)
            .unwrap_or(UserPosition {
                supplied: 0,
                borrowed: 0,
                last_accrued_ledger: env.ledger().sequence(),
            });

        // Calculate maximum borrowing capacity across all collateral assets
        let max_borrow_usd = Self::get_user_max_borrow_usd_internal(&env, &user);
        let current_borrow_usd = Self::get_user_total_borrow_usd_internal(&env, &user);
        let additional_borrow_usd = (amount * reserve.price) / 10_000_000;

        if current_borrow_usd + additional_borrow_usd > max_borrow_usd {
            panic!("insufficient collateral");
        }

        user_pos.borrowed += amount;
        env.storage().persistent().set(&pos_key, &user_pos);
        Self::extend_persistent_ttl(&env, &pos_key);

        reserve.total_borrowed += amount;
        env.storage().persistent().set(&res_key, &reserve);
        Self::extend_persistent_ttl(&env, &res_key);

        // Transfer borrowed tokens from contract to borrower
        let client = token::Client::new(&env, &token);
        client.transfer(&env.current_contract_address(), &user, &amount);

        env.events().publish((symbol_short!("borrow"), user, token), amount);
    }

    /// Repay borrowed funds
    pub fn repay_asset(env: Env, user: Address, token: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        Self::accrue_interest_internal(&env, &token);

        let pos_key = DataKey::UserPosition(user.clone(), token.clone());
        let mut user_pos: UserPosition = env
            .storage()
            .persistent()
            .get(&pos_key)
            .expect("no borrowed position");

        if user_pos.borrowed < amount {
            panic!("repaying more than borrowed");
        }

        // Transfer repayment from user to contract
        let client = token::Client::new(&env, &token);
        client.transfer(&user, &env.current_contract_address(), &amount);

        user_pos.borrowed -= amount;
        env.storage().persistent().set(&pos_key, &user_pos);
        Self::extend_persistent_ttl(&env, &pos_key);

        let res_key = DataKey::Reserve(token.clone());
        let mut reserve: ReserveData = env
            .storage()
            .persistent()
            .get(&res_key)
            .expect("reserve not found");
        reserve.total_borrowed -= amount;
        env.storage().persistent().set(&res_key, &reserve);
        Self::extend_persistent_ttl(&env, &res_key);

        env.events().publish((symbol_short!("repay"), user, token), amount);
    }

    /// Liquidate an undercollateralized position
    pub fn liquidate(
        env: Env,
        liquidator: Address,
        borrower: Address,
        debt_token: Address,
        collateral_token: Address,
        debt_amount: i128,
    ) {
        liquidator.require_auth();
        Self::require_not_paused(&env);
        if debt_amount <= 0 {
            panic!("invalid amount");
        }

        // Accrue interest on both markets
        Self::accrue_interest_internal(&env, &debt_token);
        Self::accrue_interest_internal(&env, &collateral_token);

        // Verify borrower is eligible for liquidation (HF < 10000 bps = 1.0)
        let health_factor = Self::get_health_factor_internal(&env, &borrower);
        if health_factor >= BPS_SCALING as u32 || health_factor == 0 {
            panic!("position is healthy");
        }

        let debt_pos_key = DataKey::UserPosition(borrower.clone(), debt_token.clone());
        let mut debt_pos: UserPosition = env
            .storage()
            .persistent()
            .get(&debt_pos_key)
            .expect("no debt position");

        if debt_pos.borrowed < debt_amount {
            panic!("repaying more than borrowed");
        }

        let col_pos_key = DataKey::UserPosition(borrower.clone(), collateral_token.clone());
        let mut col_pos: UserPosition = env
            .storage()
            .persistent()
            .get(&col_pos_key)
            .expect("no collateral position");

        let debt_res_key = DataKey::Reserve(debt_token.clone());
        let mut debt_reserve: ReserveData = env
            .storage()
            .persistent()
            .get(&debt_res_key)
            .expect("debt reserve not found");

        let col_res_key = DataKey::Reserve(collateral_token.clone());
        let mut col_reserve: ReserveData = env
            .storage()
            .persistent()
            .get(&col_res_key)
            .expect("collateral reserve not found");

        // Calculate collateral to seize with liquidation bonus
        let debt_value_usd = (debt_amount * debt_reserve.price) / 10_000_000;
        let bonus_multiplier = BPS_SCALING + (col_reserve.liquidation_bonus_bps as i128);
        let collateral_value_to_seize = (debt_value_usd * bonus_multiplier) / BPS_SCALING;
        let collateral_amount_to_seize = (collateral_value_to_seize * 10_000_000) / col_reserve.price;

        if col_pos.supplied < collateral_amount_to_seize {
            panic!("insufficient collateral in target asset");
        }

        // Liquidator repays debt
        let debt_client = token::Client::new(&env, &debt_token);
        debt_client.transfer(&liquidator, &env.current_contract_address(), &debt_amount);

        // Liquidator receives seized collateral
        let col_client = token::Client::new(&env, &collateral_token);
        col_client.transfer(&env.current_contract_address(), &liquidator, &collateral_amount_to_seize);

        // Update borrower's debt and collateral
        debt_pos.borrowed -= debt_amount;
        env.storage().persistent().set(&debt_pos_key, &debt_pos);
        Self::extend_persistent_ttl(&env, &debt_pos_key);

        col_pos.supplied -= collateral_amount_to_seize;
        env.storage().persistent().set(&col_pos_key, &col_pos);
        Self::extend_persistent_ttl(&env, &col_pos_key);

        debt_reserve.total_borrowed -= debt_amount;
        env.storage().persistent().set(&debt_res_key, &debt_reserve);
        Self::extend_persistent_ttl(&env, &debt_res_key);

        col_reserve.total_supplied -= collateral_amount_to_seize;
        env.storage().persistent().set(&col_res_key, &col_reserve);
        Self::extend_persistent_ttl(&env, &col_res_key);

        env.events().publish(
            (symbol_short!("liquidate"), liquidator, borrower),
            (debt_amount, collateral_amount_to_seize),
        );
    }

    // ── Backward-Compatible Scalable Convenience API ─────────────────────────
    // These functions maintain exact backward compatibility for existing scripts
    // while migrating from instance storage to scalable persistent storage!

    /// Scalable deposit into primary pool
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut data = Self::get_account_data_internal(&env, &user);
        data.supplied += amount;
        
        let key = DataKey::UserAccount(user.clone());
        env.storage().persistent().set(&key, &data);
        Self::extend_persistent_ttl(&env, &key);

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalSupplied).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&DataKey::TotalSupplied, &total);
        Self::extend_instance_ttl(&env);

        env.events().publish((symbol_short!("deposit"), user), amount);
    }

    /// Scalable withdraw from primary pool
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut data = Self::get_account_data_internal(&env, &user);
        if data.supplied < amount {
            panic!("insufficient supplied balance");
        }
        data.supplied -= amount;

        // Health check: max borrow = 75% of remaining supply
        let max_borrow = (data.supplied * 75) / 100;
        if data.borrowed > max_borrow {
            panic!("insufficient collateral");
        }

        let key = DataKey::UserAccount(user.clone());
        env.storage().persistent().set(&key, &data);
        Self::extend_persistent_ttl(&env, &key);

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalSupplied).unwrap_or(0);
        total -= amount;
        env.storage().instance().set(&DataKey::TotalSupplied, &total);
        Self::extend_instance_ttl(&env);

        env.events().publish((symbol_short!("withdraw"), user), amount);
    }

    /// Scalable borrow from primary pool
    pub fn borrow(env: Env, user: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut data = Self::get_account_data_internal(&env, &user);
        let max_borrow = (data.supplied * 75) / 100;
        if data.borrowed + amount > max_borrow {
            panic!("insufficient collateral");
        }

        data.borrowed += amount;
        let key = DataKey::UserAccount(user.clone());
        env.storage().persistent().set(&key, &data);
        Self::extend_persistent_ttl(&env, &key);

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalBorrowed).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&DataKey::TotalBorrowed, &total);
        Self::extend_instance_ttl(&env);

        env.events().publish((symbol_short!("borrow"), user), amount);
    }

    /// Scalable repay to primary pool
    pub fn repay(env: Env, user: Address, amount: i128) {
        user.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut data = Self::get_account_data_internal(&env, &user);
        if data.borrowed < amount {
            panic!("repaying more than borrowed");
        }

        data.borrowed -= amount;
        let key = DataKey::UserAccount(user.clone());
        env.storage().persistent().set(&key, &data);
        Self::extend_persistent_ttl(&env, &key);

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalBorrowed).unwrap_or(0);
        total -= amount;
        env.storage().instance().set(&DataKey::TotalBorrowed, &total);
        Self::extend_instance_ttl(&env);

        env.events().publish((symbol_short!("repay"), user), amount);
    }

    /// Get user account details (backed by isolated persistent storage)
    pub fn get_account_data(env: Env, user: Address) -> AccountData {
        Self::get_account_data_internal(&env, &user)
    }

    /// Get aggregate protocol statistics
    pub fn get_protocol_stats(env: Env) -> (i128, i128) {
        let supplied: i128 = env.storage().instance().get(&DataKey::TotalSupplied).unwrap_or(0);
        let borrowed: i128 = env.storage().instance().get(&DataKey::TotalBorrowed).unwrap_or(0);
        (supplied, borrowed)
    }

    /// Get details for a specific reserve
    pub fn get_reserve_data(env: Env, token: Address) -> Option<ReserveData> {
        let res_key = DataKey::Reserve(token);
        env.storage().persistent().get(&res_key)
    }

    /// Get position for a user on a specific reserve
    pub fn get_user_position(env: Env, user: Address, token: Address) -> UserPosition {
        let pos_key = DataKey::UserPosition(user, token);
        env.storage().persistent().get(&pos_key).unwrap_or(UserPosition {
            supplied: 0,
            borrowed: 0,
            last_accrued_ledger: env.ledger().sequence(),
        })
    }

    /// Calculate user Health Factor (in basis points: 10,000 = 1.0)
    pub fn get_health_factor(env: Env, user: Address) -> u32 {
        Self::get_health_factor_internal(&env, &user)
    }

    // ── Internal Helper Functions ────────────────────────────────────────────

    fn require_admin(env: &Env, admin: &Address) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if *admin != stored_admin {
            panic!("unauthorized");
        }
    }

    fn require_not_paused(env: &Env) {
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            panic!("contract paused");
        }
    }

    fn extend_instance_ttl(env: &Env) {
        env.storage().instance().extend_ttl(MIN_INSTANCE_TTL, EXTEND_INSTANCE_TTL);
    }

    fn extend_persistent_ttl(env: &Env, key: &DataKey) {
        env.storage().persistent().extend_ttl(key, MIN_PERSISTENT_TTL, EXTEND_PERSISTENT_TTL);
    }

    fn get_account_data_internal(env: &Env, user: &Address) -> AccountData {
        let key = DataKey::UserAccount(user.clone());
        env.storage().persistent().get(&key).unwrap_or(AccountData {
            supplied: 0,
            borrowed: 0,
        })
    }

    fn accrue_interest_internal(env: &Env, token: &Address) {
        let res_key = DataKey::Reserve(token.clone());
        if let Some(mut reserve) = env.storage().persistent().get::<DataKey, ReserveData>(&res_key) {
            let current_ledger = env.ledger().sequence();
            let elapsed_ledgers = current_ledger.saturating_sub(reserve.last_update_ledger);
            if elapsed_ledgers > 0 && reserve.total_supplied > 0 {
                // Utilization = total_borrowed / total_supplied
                let utilization_bps = (reserve.total_borrowed * BPS_SCALING) / reserve.total_supplied;
                let borrow_rate_bps = (reserve.base_rate_bps as i128)
                    + (utilization_bps * (reserve.slope_rate_bps as i128)) / BPS_SCALING;

                // Accrue interest index: index = index * (1 + rate * elapsed / year)
                // 1 year ~= 6_307_200 ledgers
                let interest_factor = (borrow_rate_bps * (elapsed_ledgers as i128)) / 6_307_200;
                reserve.borrow_index += (reserve.borrow_index * interest_factor) / BPS_SCALING;
                reserve.supply_index += (reserve.supply_index * interest_factor * utilization_bps) / (BPS_SCALING * BPS_SCALING);
                reserve.last_update_ledger = current_ledger;

                env.storage().persistent().set(&res_key, &reserve);
                Self::extend_persistent_ttl(env, &res_key);
            }
        }
    }

    fn get_user_max_borrow_usd_internal(env: &Env, user: &Address) -> i128 {
        let reserves: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::ReserveList)
            .unwrap_or_else(|| Vec::new(env));
        let mut total_collateral_usd: i128 = 0;

        for i in 0..reserves.len() {
            let token = reserves.get(i).unwrap();
            let pos_key = DataKey::UserPosition(user.clone(), token.clone());
            if let Some(pos) = env.storage().persistent().get::<DataKey, UserPosition>(&pos_key) {
                let res_key = DataKey::Reserve(token);
                if let Some(res) = env.storage().persistent().get::<DataKey, ReserveData>(&res_key) {
                    let asset_value_usd = (pos.supplied * res.price) / 10_000_000;
                    let borrowable_value = (asset_value_usd * (res.ltv_bps as i128)) / BPS_SCALING;
                    total_collateral_usd += borrowable_value;
                }
            }
        }
        total_collateral_usd
    }

    fn get_user_total_borrow_usd_internal(env: &Env, user: &Address) -> i128 {
        let reserves: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::ReserveList)
            .unwrap_or_else(|| Vec::new(env));
        let mut total_borrow_usd: i128 = 0;

        for i in 0..reserves.len() {
            let token = reserves.get(i).unwrap();
            let pos_key = DataKey::UserPosition(user.clone(), token.clone());
            if let Some(pos) = env.storage().persistent().get::<DataKey, UserPosition>(&pos_key) {
                let res_key = DataKey::Reserve(token);
                if let Some(res) = env.storage().persistent().get::<DataKey, ReserveData>(&res_key) {
                    let borrow_value_usd = (pos.borrowed * res.price) / 10_000_000;
                    total_borrow_usd += borrow_value_usd;
                }
            }
        }
        total_borrow_usd
    }

    fn get_health_factor_internal(env: &Env, user: &Address) -> u32 {
        let total_borrow_usd = Self::get_user_total_borrow_usd_internal(env, user);
        if total_borrow_usd == 0 {
            return 100_000; // Safe position (10.0 HF)
        }

        let reserves: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::ReserveList)
            .unwrap_or_else(|| Vec::new(env));
        let mut total_liquidation_collateral_usd: i128 = 0;

        for i in 0..reserves.len() {
            let token = reserves.get(i).unwrap();
            let pos_key = DataKey::UserPosition(user.clone(), token.clone());
            if let Some(pos) = env.storage().persistent().get::<DataKey, UserPosition>(&pos_key) {
                let res_key = DataKey::Reserve(token);
                if let Some(res) = env.storage().persistent().get::<DataKey, ReserveData>(&res_key) {
                    let asset_value_usd = (pos.supplied * res.price) / 10_000_000;
                    let threshold_value = (asset_value_usd * (res.liquidation_threshold_bps as i128)) / BPS_SCALING;
                    total_liquidation_collateral_usd += threshold_value;
                }
            }
        }

        let hf = (total_liquidation_collateral_usd * BPS_SCALING) / total_borrow_usd;
        hf as u32
    }
}
