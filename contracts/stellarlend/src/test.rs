#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env};

fn setup_test_environment() -> (Env, Address, Address, StellarLendClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarLend, ());
    let client = StellarLendClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);
    (env, admin, user, client)
}

#[test]
fn test_initialize() {
    let (env, admin, _user, _client) = setup_test_environment();
    // Verify admin cannot initialize twice
    let contract_id = env.register(StellarLend, ());
    let client2 = StellarLendClient::new(&env, &contract_id);
    client2.initialize(&admin);
}

#[test]
fn test_scalable_persistent_storage_deposit_and_borrow() {
    let (_env, _admin, user, client) = setup_test_environment();

    // Test deposit
    client.deposit(&user, &1000);
    let data = client.get_account_data(&user);
    assert_eq!(data.supplied, 1000);
    assert_eq!(data.borrowed, 0);

    // Test borrow (max 75% = 750)
    client.borrow(&user, &700);
    let data = client.get_account_data(&user);
    assert_eq!(data.borrowed, 700);

    // Test repay
    client.repay(&user, &200);
    let data = client.get_account_data(&user);
    assert_eq!(data.borrowed, 500);

    // Test withdraw
    client.withdraw(&user, &100);
    let data = client.get_account_data(&user);
    assert_eq!(data.supplied, 900);

    // Protocol stats
    let (total_supplied, total_borrowed) = client.get_protocol_stats();
    assert_eq!(total_supplied, 900);
    assert_eq!(total_borrowed, 500);
}

#[test]
fn test_multi_user_scalability_isolation() {
    let (env, _admin, user1, client) = setup_test_environment();
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    client.deposit(&user1, &5000);
    client.deposit(&user2, &10000);
    client.deposit(&user3, &15000);

    client.borrow(&user1, &2000);
    client.borrow(&user2, &6000);

    let data1 = client.get_account_data(&user1);
    let data2 = client.get_account_data(&user2);
    let data3 = client.get_account_data(&user3);

    assert_eq!(data1.supplied, 5000);
    assert_eq!(data1.borrowed, 2000);

    assert_eq!(data2.supplied, 10000);
    assert_eq!(data2.borrowed, 6000);

    assert_eq!(data3.supplied, 15000);
    assert_eq!(data3.borrowed, 0);

    let (total_supplied, total_borrowed) = client.get_protocol_stats();
    assert_eq!(total_supplied, 30000);
    assert_eq!(total_borrowed, 8000);
}

#[test]
#[should_panic(expected = "insufficient collateral")]
fn test_borrow_fails_if_insufficient_collateral() {
    let (_env, _admin, user, client) = setup_test_environment();
    client.deposit(&user, &1000);
    client.borrow(&user, &800);
}

#[test]
#[should_panic(expected = "insufficient supplied balance")]
fn test_withdraw_fails_if_exceeds_supply() {
    let (_env, _admin, user, client) = setup_test_environment();
    client.deposit(&user, &500);
    client.withdraw(&user, &600);
}

#[test]
#[should_panic(expected = "repaying more than borrowed")]
fn test_repay_fails_if_exceeds_debt() {
    let (_env, _admin, user, client) = setup_test_environment();
    client.deposit(&user, &1000);
    client.borrow(&user, &400);
    client.repay(&user, &500);
}

#[test]
fn test_multi_reserve_token_lifecycle_and_liquidation() {
    let (env, admin, borrower, client) = setup_test_environment();
    let liquidator = Address::generate(&env);

    // Create two mock tokens: XLM (Collateral) & USDC (Debt)
    let token_admin = Address::generate(&env);
    let xlm_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let usdc_contract = env.register_stellar_asset_contract_v2(token_admin.clone());

    let xlm_token = xlm_contract.address();
    let usdc_token = usdc_contract.address();

    let xlm_admin_client = token::StellarAssetClient::new(&env, &xlm_token);
    let usdc_admin_client = token::StellarAssetClient::new(&env, &usdc_token);

    // Mint tokens to users
    xlm_admin_client.mint(&borrower, &10_000_0000000); // 10,000 XLM
    usdc_admin_client.mint(&admin, &50_000_0000000);    // 50,000 USDC
    usdc_admin_client.mint(&liquidator, &10_000_0000000); // 10,000 USDC

    // Initialize reserves
    // XLM: Price $1.00 (10_000_000), LTV 75%, Liq Threshold 80%, Liq Bonus 5%
    client.init_reserve(
        &admin,
        &xlm_token,
        &7500,
        &8000,
        &500,
        &200,
        &800,
        &10_000_000,
    );

    // USDC: Price $1.00 (10_000_000), LTV 85%, Liq Threshold 90%, Liq Bonus 5%
    client.init_reserve(
        &admin,
        &usdc_token,
        &8500,
        &9000,
        &500,
        &100,
        &400,
        &10_000_000,
    );

    // Admin seeds USDC liquidity into the protocol pool
    client.deposit_asset(&admin, &usdc_token, &20_000_0000000);

    // Borrower deposits 1,000 XLM ($1,000)
    client.deposit_asset(&borrower, &xlm_token, &1_000_0000000);

    let borrower_pos = client.get_user_position(&borrower, &xlm_token);
    assert_eq!(borrower_pos.supplied, 1_000_0000000);

    // Borrower borrows 700 USDC ($700, max is 75% = $750)
    client.borrow_asset(&borrower, &usdc_token, &700_0000000);

    let hf = client.get_health_factor(&borrower);
    // Collateral $1000 * 80% = $800 threshold / $700 debt = 1.1428 (11428 bps)
    assert!(hf > 10000);

    // Price of XLM drops from $1.00 to $0.70 ($7_000_000)
    // Collateral is now 1000 * $0.70 = $700. Threshold value = $700 * 80% = $560.
    // Debt = $700. HF = 560 / 700 = 0.80 (8000 bps) -> Undercollateralized!
    client.set_asset_price(&admin, &xlm_token, &7_000_000);

    let hf_after_drop = client.get_health_factor(&borrower);
    assert!(hf_after_drop < 10000);

    // Liquidator performs liquidation of 300 USDC debt
    client.liquidate(
        &liquidator,
        &borrower,
        &usdc_token,
        &xlm_token,
        &300_0000000,
    );

    // Verify borrower debt was reduced
    let borrower_usdc = client.get_user_position(&borrower, &usdc_token);
    assert_eq!(borrower_usdc.borrowed, 400_0000000);

    // Verify borrower collateral was seized
    let borrower_xlm = client.get_user_position(&borrower, &xlm_token);
    assert!(borrower_xlm.supplied < 1_000_0000000);
}

#[test]
#[should_panic(expected = "contract paused")]
fn test_contract_pause_prevents_actions() {
    let (_env, admin, user, client) = setup_test_environment();
    client.set_paused(&admin, &true);
    client.deposit(&user, &100);
}

#[test]
fn test_contract_unpause_restores_actions() {
    let (_env, admin, user, client) = setup_test_environment();
    client.set_paused(&admin, &true);
    client.set_paused(&admin, &false);
    client.deposit(&user, &100);
    assert_eq!(client.get_account_data(&user).supplied, 100);
}
