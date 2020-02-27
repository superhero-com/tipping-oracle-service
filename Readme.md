# Tipping Oracle Service

## Docker Service

 - Build Image `docker build -t oracle-service .`
 - Create Data Directory to persist keypair/oracle `mkdir data && sudo chown 1001:1001 data`
 - Run Service `docker run -it --init -v $PWD/data/:/app/.data/ -e NODE_URL=https://mainnet.aeternal.io oracle-service`
 - Follow instructions to fund account
 - Provide oracle id to service operators to include as trusted oracle
