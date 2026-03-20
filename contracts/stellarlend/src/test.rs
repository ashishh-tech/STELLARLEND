#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, Address};

#[test]
fn test_deposit_and_borrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, StellarLend);
    let client = StellarLendClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    // Test deposit
    client.deposit(&user, &1000);
    let data = client.get_account_data(&user);
    assert_eq!(data.supplied, 1000);

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
}
