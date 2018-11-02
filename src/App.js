'use strict'
import React from 'react'
import ipfsAPI from 'ipfs-api'
import { Qtum } from 'qtumjs'
import Button from '@material-ui/core/Button'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import CircularProgress from '@material-ui/core/CircularProgress'
import { withStyles } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { blue } from '@material-ui/core/colors'
import repo from './solar.development.json'

const theme = createMuiTheme({
    typography: {
        useNextVariants: true
    },
    palette: {
        primary: {
            light: blue[300],
            main: blue[500],
            dark: blue[700],
            contrastText: '#fff'
        }
    }
})

const styles = (theme) => ({
    container: {
        width: '960px',
        margin: '0 auto'
    },
    input: {
        display: 'none'
    },
    button: {
        margin: theme.spacing.unit
    },
    snackbar: {
        margin: theme.spacing.unit
    },
    fileHash: {
        color: '#fff',
        underline: 'none'
    }
})

@withStyles(styles)
export default class App extends React.Component {

    state = {
        added_file_hash: null,
        files_in_contract: [],
        addressArray: [],
        loading: false
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
        this.setState({ loading: true })
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
            this.setState({ added_file_hash: ipfsId, loading: false })
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
        const { added_file_hash, files_in_contract, addressArray, loading } = this.state
        const style = { width: '50%' }
        const { classes } = this.props
        return (
            <MuiThemeProvider theme={theme}>
                <Grid className={classes.container} container spacing={24}>
                    <CssBaseline />
                    <Grid item xs={4}>
                        <input
                            className={classes.input}
                            id="outlined-button-file"
                            type="file"
                            onChange={this.captureFile}
                        />
                        <label htmlFor="outlined-button-file">
                            {
                                loading ? <CircularProgress className={classes.progress} />
                                    :
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        color="primary"
                                        className={classes.button}
                                    >
                                        Upload
                                    </Button>
                            }
                        </label>
                    </Grid>
                    <Grid item xs={8}>
                        {
                            added_file_hash ?
                                <div>
                                    <Button
                                        variant="outlined"
                                        component="a"
                                        color="success"
                                        className={classes.button}
                                        target='_blank'
                                        href={'https://ipfs.io/ipfs/' + added_file_hash}
                                    >
                                        {added_file_hash}
                                    </Button>
                                </div>
                                :
                                null
                        }
                    </Grid>
                    <Table>
                        <TableBody>
                            {
                                files_in_contract.map((file, index) => (
                                    <TableRow key={index}>
                                        <TableCell style={style}>{file}</TableCell>
                                        <TableCell style={style}>{addressArray[index]}</TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </Grid>
            </MuiThemeProvider>
        )
    }
}
