const StellarSdk = require('stellar-sdk');

async function run() {
  const SERVER_URL = 'https://soroban-testnet.stellar.org';
  const CONTRACT_ID = 'CAFIUXARRNE45E3ZWSKSR3B3G5ZJYR3YMBRJJXTOFFFUN6CHRR3SLQSU';
  const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
  
  // Generate a VALID Stellar keypair
  const kp = StellarSdk.Keypair.random();
  const userAddress = kp.publicKey();
  console.log('Using valid generated address:', userAddress);

  const server = new StellarSdk.SorobanRpc.Server(SERVER_URL);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const amountScv = StellarSdk.nativeToScVal(
    BigInt(10_000_000), // 1 XLM (7 decimals)
    { type: 'i128' }
  );
  
  // In SDK v12, we can use new StellarSdk.Address(userAddress) as in the frontend code
  const userScv = new StellarSdk.Address(userAddress).toScVal();

  const account = new StellarSdk.Account(userAddress, '1'); // dummy sequence

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
