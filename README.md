# qtum-ipfs
A demo for sharing files via Qtum and IPFS.

# How it works
![image](doc/image/1.png)

# Quick Start
## Prerequirements
1. Get the source code and install dependencies.
```
$ git clone https://github.com/qtumproject/qtum-ipfs.git
$ cd qtum-ipfs
$ npm install
```

2. Install the [Solidity compiler](https://solidity.readthedocs.io/en/latest/installing-solidity.html#building-from-source). You'd better install it from a binary package or the source code.
3. Install [Solar](https://github.com/qtumproject/solar). Solar is a smart contract deployment tool of Qtum.

4. Start a local IPFS node or use a public one.
```
// configuration in file src/App.js for a public node of Infura
ipfsApi = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})

// command to start a local IPFS node and set up CORS
$ ipfs daemon
$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"*\"]"
$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials "[\"true\"]"
// configuration in file src/App.js for a local node
ipfsApi = ipfsAPI('localhost', '5001', {protocol: 'http'})
```

5. Start a Qtum node and a [CORS proxy](https://github.com/bitcoin/bitcoin/pull/12040).
```
// start a Qtum QT node on Mac with RPC parameters specified
$ /Applications/Qtum-Qt.app/Contents/MacOS/Qtum-Qt -testnet -server -rpcuser=atx -rpcpassword=atx -rpcport=13889

// start a CORS proxy
$ npm install -g local-cors-proxy
$ lcp --proxyUrl http://localhost:13889  --proxyPartial "" --port 8010

// configuration in file src/App.js
contract = (new Qtum('http://atx:atx@127.0.0.1:8010', repo)).contract('IpfsRecord.sol')
```

## Deployment
1. Deploy the smart contract. Make sure there are some coins left in the sender address after deployment for futurn usage.
```
// command for deploying the smart contract, generating a file named solar.development.json
$ cd src
$ solar deploy IpfsRecord.sol --qtum_rpc="http://atx:atx@127.0.0.1:13889/"

// configuration in file src/App.js
import repo from './solar.development.json'

// in file solar.development.json
{
  "contracts": {
    "IpfsRecord.sol": {
      "source": "IpfsRecord.sol:IpfsRecord",
      "abi": ...,
      "bin": ...,
      "binhash": "3192a61fb90d58e13313cbcad551892014f423c637b9633ef42c9d3c56610e54",
      "name": "IpfsRecord",
      "deployName": "IpfsRecord.sol",
      "address": "a5cbd6eaa89b349d13ce24331406a89d04e9d90a",
      "txid": "b97a8a562b3fb6aeab9d4b023025182141092bb41dcb3955aecf27ffc82eb30d",
      "createdAt": "2018-11-15T10:31:23.43932943+08:00",
      "confirmed": true,
      "sender": "qWE1ZZEs7yxoEGzdLVZnNqsmuLPSThi4d6",
      "senderHex": "8aefb4b0ff32c65e9dc4d8036cd6cec0b4c7fe9f"
    }
  },
  "libraries": {},
  "related": {}
}
```

2. Start the system.
```
$ cd ..
$ npm start
```

3. Open URL http://localhost:3000/ in your browser, and you will see a page with an UPLOAD button on it. Now you can upload any files and share it with others through this platform. After several files uploaded, the page will be like follows.

![image](doc/image/2.png)
