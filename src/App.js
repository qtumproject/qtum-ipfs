'use strict'
const React = require('react')
const ipfsAPI = require('ipfs-api')

//qtum initial
const { Qtum } = require("qtumjs")

class App extends React.Component {
  constructor () {
    super()
    this.state = {
      added_file_hash: null,
      filename_in_contract:null,
      filehash_in_contract:null
    }
    //ipfs initial
    this.ipfsApi = ipfsAPI('ipfs.infura.io', '5001',{protocol: 'https'})
    //this.ipfsApi = ipfsAPI('localhost', '5001')
    //qtum initial
    const repo = require('./solar.development.json');
    const qtum = new Qtum('http://atx:atx@localhost:8010', repo);
    this.contract = qtum.contract('ipfs.sol');
    // bind methods
    this.captureFile = this.captureFile.bind(this)
    this.saveToIpfs = this.saveToIpfs.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  captureFile (event) {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    console.log(reader)
    reader.onloadend = () => this.saveToIpfs(reader)
    reader.readAsArrayBuffer(file)
  }

  saveToIpfs (reader) {
    let ipfsId
    let fileName
    let fromAddr
    let nameArr = new Array()
    let hashArr = new Array()
    //let fileArr = new Array()
    const buffer = Buffer.from(reader.result)

    const beforeCallRes = this.contract.call("getindex").then((res) => {
          const recordNum =  res["outputs"][0]["words"][0]
          console.log("how many records in the contract:", recordNum)
          /*for (var i=0;i<recordNum;i++){
            this.contract.call("getname", [i]).then((nameRes) => {
              var tmpName = nameRes['outputs'][0].toString()
              nameArr.push(tmpName)
              this.contract.call("gethash", [tmpName]).then((hashRes) => {
                var tmpHash = hashRes['outputs'][0].toString()
                hashArr.push(tmpHash)
              })

            })
          }*/
    })
     console.log("name array :", nameArr)

     console.log("hash array :", hashArr)
     this.setState({filename_in_contract: nameArr})
     this.setState({filehash_in_contract: hashArr})


    this.ipfsApi.add(buffer, { progress: (prog) => console.log(`received: ${prog}`) })
      .then((response) => {
        console.log(response)
        ipfsId = response[0].hash
        console.log(ipfsId)
        this.setState({added_file_hash: ipfsId})

        //add  a record to the contract of qtum
        fromAddr = 'qd8KM6Zb6TdAes1u9opK4Cr6YbhLKiQ6U9'
        fileName = "test-file-name"
        this.receipt = this.contract.send("sendHash", [fileName, ipfsId], {senderAddress: fromAddr,}).then((sendres) => {
          console.log("send response fee:", sendres['fee'])
          console.log("send response txid:", sendres['txid'])
          console.log("send response confirmations:", sendres['confirmations'])

        })
      })
      .catch((err) => {
        console.error(err)
      })
  }

  handleSubmit (event) {
    event.preventDefault()
  }

  render () {
    return (
      <div>
        <form id='captureMedia' onSubmit={this.handleSubmit}>
          <input type='file' onChange={this.captureFile} />
        </form>
        <div>
          <a target='_blank'
            href={'https://ipfs.io/ipfs/' + this.state.added_file_hash}>
            {this.state.added_file_hash}
          </a>

        </div>
      </div>
    )
  }
}
module.exports = App
