'use strict'
import React from 'react'
import ipfsAPI from 'ipfs-api'
import { Qtum } from 'qtumjs'

class App extends React.Component {
    constructor() {
        super()
        this.state = {
            added_file_hash: null,
            files_in_contract: [],
            addressArray: []
        }
        //ipfs initial
        this.ipfsApi = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })
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

    captureFile(event) {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        this.fileName = event.target.files[0]['name']
        reader.onloadend = () => this.saveToIpfs(reader)
        reader.readAsArrayBuffer(file)
    }

    saveToIpfs(reader) {
        let ipfsId
        let fromAddr
        let sendStr
        let fileResult = new Array()
        const buffer = Buffer.from(reader.result)

        //get each record in the contract
        const beforeCallRes = this.contract.call("getIndex").then((res) => {
            const recordNum = res["outputs"][0]["words"][0]
            console.log("how many records in the contract:", recordNum)
            Promise.all(Array.from({ length: recordNum }, (item, i) => this.contract.call("getRecord", [i])))
                .then((results) => {
                    results.forEach((recordRes, i) => {
                        const oneRecord = recordRes['outputs'][0].toString()
                        fileResult.push(oneRecord)
                    })
                })
        })

        //get the sender address array
        this.contract.call("getAddressArr").then((res) => {
            this.setState({
                addressArray: res['outputs'][0]
            })
            console.log("all send address array :", this.state.addressArray)
        })

        console.log("file result:", fileResult)

        this.setState({
            files_in_contract: fileResult
        })

        //add a file to ipfs
        this.ipfsApi.add(buffer, { progress: (prog) => console.log(`received: ${prog}`) })
            .then((response) => {
                console.log(response)
                ipfsId = response[0].hash
                console.log(ipfsId)
                this.setState({ added_file_hash: ipfsId })

                //add  a record to the contract of qtum
                fromAddr = 'qd8KM6Zb6TdAes1u9opK4Cr6YbhLKiQ6U9'
                let myDate = new Date();
                sendStr = this.fileName + '__' + ipfsId + '__' + Date.parse(myDate) + '__' + myDate.toLocaleString()
                this.receipt = this.contract.send("sendHash", [sendStr], { senderAddress: fromAddr, }).then((sendres) => {
                    console.log("send response fee:", sendres['fee'])
                    console.log("send response txid:", sendres['txid'])
                    console.log("send response confirmations:", sendres['confirmations'])
                })
            })
            .catch((err) => {
                console.error(err)
            })
    }

    handleSubmit(event) {
        event.preventDefault()
    }

    render() {
        const { added_file_hash, files_in_contract, addressArray } = this.state;
        const style = { width: '50%' }
        return (
            <div>
                <form id='captureMedia' onSubmit={this.handleSubmit}>
                    <input type='file' onChange={this.captureFile} />
                </form>
                <div>
                    <a
                        target='_blank'
                        href={'https://ipfs.io/ipfs/' + added_file_hash}
                    >
                        {added_file_hash}
                    </a>
                </div>
                <table>
                    <tbody>
                        {
                            files_in_contract.map((file, index) => (
                                <tr key={index}>
                                    <td style={style}>{file}</td>
                                    <td style={style}>{addressArray[index]}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        )
    }
}

module.exports = App
