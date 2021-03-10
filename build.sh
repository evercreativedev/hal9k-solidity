#!/usr/bin/env bash
echo 'set cwd..'
cd "$(dirname "$0")"
echo `pwd`
cd oz
echo 'cleaning up contracts..'
rm -rf contracts
echo 'creating blank contracts directory...'
mkdir contracts
echo 'moving to contract build root...'
cd ..
echo 'Cleaning up compiler cache...'
rm -rf cache
rm -rf artifacts
rm -rf contracts.orig
echo 'Making a backup of the contracts...'
cp -R contracts contracts.orig
# echo 'Removing log lines...'
# yarn run buidler remove-logs
echo 'flattening Hal9k...'
npx truffle-flattener contracts/HAL9K.sol | awk '/SPDX-License-Identifier/&&c++>0 {next} 1' | awk '/pragma experimental ABIEncoderV2;/&&c++>0 {next} 1' >> oz/contracts/HAL9K.sol
echo 'flattening Hal9kVault...'
npx truffle-flattener contracts/Hal9kVault.sol | awk '/SPDX-License-Identifier/&&c++>0 {next} 1' | awk '/pragma experimental ABIEncoderV2;/&&c++>0 {next} 1' >> oz/contracts/Hal9kVault.sol
echo 'flattening FeeApprover...'
npx truffle-flattener contracts/FeeApprover.sol | awk '/SPDX-License-Identifier/&&c++>0 {next} 1' | awk '/pragma experimental ABIEncoderV2;/&&c++>0 {next} 1' >> oz/contracts/FeeApprover.sol
echo 'flattening Hal9kv1Router...'
npx truffle-flattener contracts/Hal9kv1Router.sol | awk '/SPDX-License-Identifier/&&c++>0 {next} 1' | awk '/pragma experimental ABIEncoderV2;/&&c++>0 {next} 1' >> oz/contracts/Hal9kv1Router.sol
echo 'flattening Hal9kNFTPool...'
npx truffle-flattener contracts/Hal9kLtd/HAL9KNFTPool.sol | awk '/SPDX-License-Identifier/&&c++>0 {next} 1' | awk '/pragma experimental ABIEncoderV2;/&&c++>0 {next} 1' >> oz/contracts/HAL9KNFTPool.sol
echo 'flattening Hal9kLtd...'
npx truffle-flattener contracts/Hal9kLtd/HAL9KLtd.sol | awk '/SPDX-License-Identifier/&&c++>0 {next} 1' | awk '/pragma experimental ABIEncoderV2;/&&c++>0 {next} 1' >> oz/contracts/HAL9KLtd.sol
echo 'Removing contracts without logs...'
rm -rf contracts
echo 'Putting original contracts back...'
mv contracts.orig contracts
cd oz
echo 'Compiling flattened contracts'
npm run compile
echo "Copying artifacts to Prodartifacts"
cp -rf build/contracts/HAL9K.json ../prodartifacts/HAL9K.json
cp -rf build/contracts/Hal9kVault.json ../prodartifacts/Hal9kVault.json
cp -rf build/contracts/FeeApprover.json ../prodartifacts/FeeApprover.json
cp -rf build/contracts/Hal9kv1Router.json ../prodartifacts/Hal9kv1Router.json
cp -rf build/contracts/HAL9KLtd.json ../prodartifacts/HAL9KLtd.json
cp -rf build/contracts/HAL9KNFTPool.json ../prodartifacts/HAL9KNFTPool.json
echo 'done!'
