'use strict'
import React from 'react'
import ipfsAPI from 'ipfs-api'
import {Qtum} from 'qtumjs'
import Button from '@material-ui/core/Button'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import CircularProgress from '@material-ui/core/CircularProgress'
import {withStyles} from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles'
import {blue} from '@material-ui/core/colors'
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
        width: '1200px',
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
    },
    tableCell: {
        maxWidth: '400px',
        textOverflow: 'ellipsis',
        overflow: 'hidden'
    }
})

@ withStyles(styles)
export
default class App extends React.Component {
    state = {
        addedFileHash: null,
        filesInContract: [],
        loading: false
    }

    //init IPFS
    ipfsApi = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})
    //init Qtum
    contract = (new Qtum('http://atx:atx@127.0.0.1:8010', repo)).contract('ipfs.sol')

    componentDidMount() {
        this.getContractInfo()
    }

    getContractInfo = async() => {
        let fileResult = []

        // get record number
        const getIndexRes = await this.contract.call("getIndex")
        const recordNum = getIndexRes["outputs"][0].toNumber()
        console.log("How many records in the contract: ", recordNum)

        // get each record
        const getRecordRes = await Promise.all(Array.from({
            length: recordNum
        }, (item, i) => this.contract.call("get", [i])))
        getRecordRes.forEach((recordRes) => {
            const oneRecord = recordRes['outputs'][0].split("\t")
            if (oneRecord.length == 3) {
                fileResult.push({
                    dateTime: new Date(parseInt(oneRecord[0])).toLocaleString(),
                    fileName: oneRecord[1],
                    ipfsAddress: oneRecord[2]
                })
            }
        })

        // Show result
        console.log("Records:", fileResult)
        this.setState({
            filesInContract: fileResult,
        })
    }

    captureFile = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        const reader = new window.FileReader()
        const fileName = event.target.files[0]['name']
        reader.onloadend = () => this.saveFile(fileName, reader)
        reader.readAsArrayBuffer(file)
    }

    saveFile = async(fileName, reader) => {
        this.setState({
            loading: true
        })

        // Add file to IPFS
        console.log('Adding file to IPFS: ', fileName)
        const buffer = Buffer.from(reader.result)
        const response = await this.ipfsApi.add(buffer, {
            progress: (prog) => console.log(`IPFS received: ${prog}`)
        })
        console.log('IPFS response: ', response)
        this.setState({
            addedFileHash: response[0].hash
        })

        // Add file to Qtum
        console.log('Adding file to Qtum')
        const sendStr = (new Date()).valueOf() + "\t" + fileName + "\t" + response[0].hash
        const sendRes = await this.contract.send("add", [sendStr], {
            gasLimit: 1000000
        })
        try {
            await sendRes.confirm(1)
        } catch (e) {
            console.log(e)
        }

        // Show result
        console.log("Send response:", sendRes)
        this.getContractInfo()
        this.setState({
            loading: false
        })
    }

    render() {
        const { addedFileHash, filesInContract, addressArray, loading } = this.state
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
                            addedFileHash ?
                                <div>
                                    <Button
                                        variant="outlined"
                                        component="a"
                                        color="primary"
                                        className={classes.button}
                                        target='_blank'
                                        href={'https://ipfs.infura.io/ipfs/' + addedFileHash}
                                    >
                                        {addedFileHash}
                                    </Button>
                                </div>
                                :
                                null
                        }
                    </Grid>
                    <Table>
                        <TableBody>
                            {
                                filesInContract.map((file, index) => (
                                    <TableRow key={index}>
                                        <TableCell className={classes.tableCell}>{file['dateTime']}</TableCell>
                                        <TableCell className={classes.tableCell}>{file['fileName']}</TableCell>
                                        <TableCell className={classes.tableCell}>
                                            <a
                                                href={'https://ipfs.infura.io/ipfs/' + file['ipfsAddress']}
                                                target='_blank'
                                            >
                                                {file['ipfsAddress']}
                                            </a>
                                        </TableCell>
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
