echo "Verifying contracts"
echo "⌛ Verifying Hal9k Token"
npx hardhat verify --network rinkeby 0xc3c53D477D9767799c20063c80D045677DD5f22F "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
echo "⌛ Verifying Hal9k Ltd"
npx hardhat verify --network rinkeby 0xb513BDA86A3402317BEA9555a9f8A039e13Da348 "0xf57b2c51ded3a29e6891aba85459d600256cf317"
echo "⌛ Verifying Hal9k Vault"
npx hardhat verify --network rinkeby 0xA30E254Fd0f3346F0978FEA1944bf3Ddb838EA9e
echo "⌛ Verifying Fee Approver"
npx hardhat verify --network rinkeby 0x628742618b77E870532902188f8Cd8DA15b397C0
echo "⌛ Verifying Hal9kv1Router"
npx hardhat verify --network rinkeby 0x1a69b90000bc937BbA82Ff59043d862B470dE18c
echo "⌛ Verifying Hal9kNftPool"
npx hardhat verify --network rinkeby 0x9B161b1B33Ce41022445E943F0dD7E7F7b4260c5
echo "✅ Verification Done!"