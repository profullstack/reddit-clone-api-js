# upvotocracy-api


# install

    npm i
    npm run dev

# deploy

    npm run deploy

# btcpay server

    node -p "require('btcpay').crypto.generate_keypair()"
     BTCPAY_URL=https://btcpay.profullstack.com/ BTCPAY_KEY=... BTCPAY_PAIRCODE=... node -e "const btcpay=require('btcpay'); new btcpay.BTCPayClient(process.env.BTCPAY_URL, btcpay.crypto.load_keypair(Buffer.from(process.env.BTCPAY_KEY, 'hex'))).pair_client(process.env.BTCPAY_PAIRCODE).then(console.log).catch(console.error)"
