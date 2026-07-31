const StellarSdk = require('stellar-sdk');

async function run() {
  const SERVER_URL = 'https://soroban-testnet.stellar.org';
  const CONTRACT_ID = 'CD4M6SRU32V6UPBXLWYI6HU74RJUYTJFOCX5AFR56LF5IXLDSZSM2TYS';
  const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
  
  // Dummy user address
  const userAddress = 'GBVAAX5XJ7HFLZGB75DYY76DR6AOMY5LTLB6K3XFCPJ6PXEXV5XQL6A5';

  const server = new StellarSdk.SorobanRpc.Server(SERVER_URL);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const amountScv = StellarSdk.nativeToScVal(
    BigInt(10_000_000), // 1 XLM
    { type: 'i128' }
  );
  const userScv = new StellarSdk.Address(userAddress).toScVal();

  const account = new StellarSdk.Account(userAddress, '0');

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('deposit', userScv, amountScv))
    .setTimeout(60)
    .build();

  console.log('Simulating transaction...');
  const simResponse = await server.simulateTransaction(tx);
  console.log('Simulation Success:', StellarSdk.SorobanRpc.Api.isSimulationSuccess(simResponse));
  console.log('Full Simulation Response:', JSON.stringify(simResponse, null, 2));
}

run().catch(console.error);
