
docker run --env NETWORK=testnet --restart=unless-stopped -P -d --network=host -v /root/bitcoin-node --name testnet jeshan/bitcore-node
