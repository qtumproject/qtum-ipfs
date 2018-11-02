# qtum-ipfs
Qtum-ipfs can help you record the file hash and sender address in the contract of Qtum when you upload a file to IPFS.

See [documentation](https://qtumproject.github.io/qtumjs-doc/).

See [中文 API 文档](https://qtumproject.github.io/qtumjs-doc-cn/).

See [js-ipfs-api documentation](https://github.com/ipfs/js-ipfs-api)

# Quick Start

Before you start your own qtum-ipfs demo,you should start your own IPFS node and Qtum node.

## Get the source code and install the package we need
```
git clone https://github.com/aitianxiang/qtum-ipfs.git

cd qtum-ipfs

npm install

```

## start Qtum node
```
/Applications/Qtum-Qt.app/Contents/MacOS/Qtum-Qt -testnet -server -rpcuser=atx -rpcpassword=atx -rpcport=13889

```

## start ipfs node
```
ipfs daemon
```

## Local CORS Proxy

```
npm install -g local-cors-proxy

```

Simple Example

```
lcp --proxyUrl http://localhost:13889  --proxyPartial ""
```

## start the demo web app

```
npm start

```
See http://localhost:3000/ 

