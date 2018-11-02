'use strict'
import React from 'react'
import ipfsAPI from 'ipfs-api'
import { Qtum } from 'qtumjs'
import repo from './solar.development.json'

export default class App extends React.Component {

    state = {
        added_file_hash: null,
        files_in_contract: [],
        addressArray: []
    }

    //ipfs initial
    // ipfsApi = ipfsAPI('localhost', '5001')
    ipfsApi = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })

    //qtum initial
    contract = (new Qtum('http://atx:atx@192.168.3.25:8010', repo)).contract('ipfs.sol')

    fileName = ''

    captureFile = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        const reader = new window.FileReader()
        this.fileName = event.target.files[0]['name']
        reader.onloadend = () => this.saveToIpfs(reader)
        reader.readAsArrayBuffer(file)
    }

    saveToIpfs = async (reader) => {
        let ipfsId = ''
        let fromAddr = ''
        let sendStr = ''
        let fileResult = []
        const buffer = Buffer.from(reader.result)

        //get each record in the contract
        const getIndexRes = await this.contract.call("getIndex")
        const recordNum = getIndexRes["outputs"][0]["words"][0]
        console.log("how many records in the contract:", recordNum)

        const getRecordRes = await Promise.all(Array.from({ length: recordNum }, (item, i) => this.contract.call("getRecord", [i])))
        getRecordRes.forEach((recordRes) => {
            const oneRecord = recordRes['outputs'][0].toString()
            fileResult.push(oneRecord)
        })

        //get the sender address array
        const getAddressArrRes = await this.contract.call("getAddressArr")
        this.setState({
            addressArray: getAddressArrRes['outputs'][0],
            files_in_contract: fileResult,
        })

        console.log("all send address array :", this.state.addressArray)
        console.log("file result:", fileResult)

        //add a file to ipfs
        try {
            const response = await this.ipfsApi.add(buffer, { progress: (prog) => console.log(`received: ${prog}`) })
            console.log(response)
            ipfsId = response[0].hash
            console.log(ipfsId)
            this.setState({ added_file_hash: ipfsId })
            //add  a record to the contract of qtum
            fromAddr = 'qd8KM6Zb6TdAes1u9opK4Cr6YbhLKiQ6U9'
            let myDate = new Date()
            sendStr = this.fileName + '__' + ipfsId + '__' + Date.parse(myDate) + '__' + myDate.toLocaleString()
            const sendRes = await this.contract.send("sendHash", [sendStr], { senderAddress: fromAddr, })

            console.log("send response fee:", sendRes['fee'])
            console.log("send response txid:", sendRes['txid'])
            console.log("send response confirmations:", sendRes['confirmations'])
        } catch (e) {
            console.error(e)
        }
    }

    handleSubmit = (event) => {
        event.preventDefault()
    }

    render() {
        const { added_file_hash, files_in_contract, addressArray } = this.state
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
