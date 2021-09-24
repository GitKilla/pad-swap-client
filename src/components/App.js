import React, { Component } from "react";
import TestERC20 from "../contracts/TestERC20.json";
import Padswap from "../contracts/Padswap.json";
import getWeb3 from "../getWeb3";
import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Bar from "./Bar";
import NFTCardGrid from "./NFTCardGrid";
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import Card from '@material-ui/core/Card';
import OfferIcon from './OfferIcon';
import OfferGrid from './OfferGrid';
import { CardHeader } from '@material-ui/core';
import Offer from './Offer';
import OfferList from './OfferList';

import "./App.css";



class App extends Component {
  state = {web3: null, 
            accounts: null,
            contractNFT: null, 
            contractSwap: null, 
            userAddress: null,
            traderAddress:"", 
            numUserNFTs: null,
            numTraderNFTs: null,
            userNFTs: null,
            traderNFTs: null,
            userCreatedOffers: null, 
            userOffers: null,
            userImageURLs: null,
            addressEntered: false,
            offeredNFTIds: [],
            askedNFTIds: [],
            offeredNFTContracts: [],
            askedNFTContracts: [],
            activePage: "barter",
            offerArray: [],
            askArray: [],
            ethOffer: 0,
            ethAsk: 0,
            swapApproval: null,
            swapAddress: null,
            NFTAddress: null,
            trackedNFTAddresses: [],
            trackedNFTInstances: [],
            tokenInstance: null,
            invalidAddress: false,
            inbox: true
          };

  componentDidMount = async () => {
    try {
      console.log("Begun")
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      console.log("Yikes")

      // ropsten addresses
      // const swapAddress = "0x7652a6791c304794de601f366B5B768CDb4CfBeA";
      // const NFTAddress = "0x13b939f04e9Ea0E8C28f4E8006A081E28b9a440e";
      // const NFTAddress2 = "0x4633555F8FbFA47360AC8bA3B02967cf6dF4718f";
      // const NFTAddress3 = "0x4DE4640051ECD928983Ce96dB7285Bc5AB0027a4";

      //local ganache addresses
      var swapAddress = "0x4cf52dFea44d0db6F1f19B9469C46Ed7A55747Cd";
      var tokenAddress = "0x3423e6ac488bb0c48DC9057f22f53dC3AB82d29E";

      
      // console.log(temp_array)
      this.setState({
        tokenInstance: new web3.eth.Contract(
          TestERC20.abi,
          tokenAddress
        )
      })


      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      const primaryAddress = accounts[0];
      web3.eth.defaultAccount = web3.eth.accounts[0];

      console.log("Getting swap Contract");
      // Get the Swap contract instance.
      // const deployedNetworkSwap = Swap.networks[networkId];
      const instanceSwap = new web3.eth.Contract(
        Padswap.abi,
        swapAddress
      );

      this.setState({ web3, 
        accounts,
        contractSwap: instanceSwap, 
        userAddress: accounts[0]
      });

      
      console.log("Setting more state");
      this.setState({ web3, 
        accounts, 
        contractSwap: instanceSwap, 
        userAddress: accounts[0],
        swapAddress: swapAddress,
        tokenAddress: swapAddress
      });

      console.log("Loading offers")
      this.reloadOffers();

      console.log("Subscribing to offers")
      var userAddressTopic = "0x000000000000000000000000"+String(this.state.userAddress).toLowerCase().slice(2);
      console.log(userAddressTopic);
      var subscription = web3.eth.subscribe('logs', {
        address: this.state.swapAddress,
        topics:[null,userAddressTopic]
        },(error, result) => {
          if (!error)
            console.log(result);
          this.reloadOffers();
          // window.location.reload()
        }
      )

      console.log("Second subscription")

      var subscriptionNFTApproval = web3.eth.subscribe('logs', {
        address: this.state.NFTAddress,
        topics:[null, userAddressTopic, null]
        },(error, result) => {
          if (!error)
            console.log(result);
          this.reloadApproval();
          // window.location.reload()
        }
      )

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  reloadOffers = async () => {
    var offerData = await this.getOffers();
    console.log("Offer Data: ");
    console.log(offerData);
    var askData = await this.getAsks();
    console.log("Offers: "+offerData)
      
    this.setState({
      offerArray: offerData,
      askArray: askData
    });
  };

  reloadApproval = async () => {

    const isApproved = await this.state.contractNFT.methods.isApprovedForAll(this.state.userAddress, this.state.swapAddress).call();

    this.setState({
      swapApproval: isApproved
    });
  }

  proposeTrade = async (event) => { // add approval check beforehand
    // console.log("Break 0");
    event.preventDefault();
    // const web3 = await getWeb3();
    // console.log("Break 1");
    // contractSwap.methods.getOfferOffVal(offerId).call()


    // removed this *(10**18) 
    const _offerValue = ((parseFloat(this.state.ethOffer)) || 0).toString();

    console.log("Offer Value: "+_offerValue);
    console.log("Test change")

    var spendAllowance = await this.state.tokenInstance.methods.allowance(this.state.userAddress, this.state.swapAddress).call();
    var tokenBalance = await this.state.tokenInstance.methods.balanceOf(this.state.userAddress).call();
    var isApproved = false;
    if(spendAllowance >= _offerValue)
      isApproved = true;

    if(!isApproved)
        var temp = await this.state.tokenInstance.methods.approve(this.state.swapAddress, _offerValue).send({from:this.state.userAddress});

    console.log("Eth offer - propose trade: "+_offerValue);

    const transactionReceipt = await this.state.contractSwap.methods.addOffer(_offerValue,this.state.traderAddress).send({from:this.state.userAddress})

  }

  acceptTrade = async (offerId, _askContracts) => { // add approval check beforehand
    const {tokenInstance, contractSwap } = this.state;

    var offVal = await this.state.contractSwap.methods.getOfferOffVal(offerId).call();

    var spendAllowance = await this.state.tokenInstance.methods.allowance(this.state.userAddress, this.state.swapAddress).call();
    var tokenBalance = await this.state.tokenInstance.methods.balanceOf(this.state.userAddress).call();
    var isApproved = false;
    if(spendAllowance >= offVal)
      isApproved = true;

    console.log("IS APPROVED: "+isApproved)
    if(!isApproved) 
      var temp = await this.state.tokenInstance.methods.approve(this.state.swapAddress, offVal).send({from:this.state.userAddress});
    
    const transactionReceipt = await this.state.contractSwap.methods.acceptOffer(offerId).send({from:this.state.userAddress})
  }

  cancelTrade = async (offerId) => { // add approval check beforehand
    const {contractNFT, contractSwap } = this.state;
    const transactionReceipt = await this.state.contractSwap.methods.cancelOffer(offerId).send({from:this.state.userAddress})
  }

  setActivePage = (pageName) => {
    this.setState({activePage: pageName});
  };

  getOffers = async () => {
    const {contractSwap} = this.state;
    var offData = [];
    const numOffers = await contractSwap.methods.offersCreatedCountByAddress(this.state.userAddress).call()
    console.log("Num Offers: "+numOffers)
    for(var i = 0; i < numOffers; i++) {
      var offerId = await contractSwap.methods.offersCreatedByAddress(this.state.userAddress, i).call()
      var offerState = await contractSwap.methods.getOfferState(offerId).call()
      var offVal = await contractSwap.methods.getOfferOffVal(offerId).call()
      var asker = await contractSwap.methods.getOfferAsker(offerId).call()
      if(offerState) {
        offData.push([offerId, offVal, asker]);
      }
      
    }

    if(offData == null )
    {
      console.log("OFFER DATA RETURNED IS NULL")
    }

    return offData

  };

  getAsks = async () => {
    const {contractSwap} = this.state;
    var askData = [];
    const numOffers = await contractSwap.methods.offerCountByAddress(this.state.userAddress).call()

    for(var i = 0; i < numOffers; i++) {
      var offerId = await contractSwap.methods.offersByAddress(this.state.userAddress, i).call()
      var offerState = await contractSwap.methods.getOfferState(offerId).call()
      var offVal = await contractSwap.methods.getOfferOffVal(offerId).call()
      var asker = await contractSwap.methods.getOfferOfferer(offerId).call()
      if(offerState) {
        askData.push([offerId, offVal, asker]);
      }
      
    }

    return askData

  }

  handleSubmit = async (event) => {

    event.preventDefault();

    try {
      this.setState({addressEntered: true});
    } catch (error) {
      this.setState({invalidAddress: true});
    }
    
  };

  handleAddressChange = async (event) => {

    event.preventDefault();
    this.setState({traderAddress: event.target.value});
    console.log("Address: "+this.state.traderAddress);
    console.log("Event value: "+event.target.value);
  };

  handleEthOfferChange = async (event) => {

    this.setState({ethOffer: event.target.value});
    console.log("Eth offer: "+ this.state.ethOffer);
    console.log("Event value: "+event.target.value);
  };
  

  render() {
    
    // if (!this.state.web3) {
    //   return <div>Loading Web3, accounts, and contract...</div>;
    // }

    if(this.state.activePage == "barter") {

      return (

        <div className="App">
          <Bar setActivePage={this.setActivePage}></Bar>
          <div>
          <div>&nbsp;</div>
          <Grid container justify='center'>
          <Card style={{ 
                 fontColor: 'white'
                , border:'10px'
                , borderColor:'#000000'
                , minHeight: '2vh'
                , maxHeight: '2vh'
                , paddingLeft: 10
                , paddingRight: 10
                , paddingTop: 3
                , paddingBottom: 3
                , borderRadius: '5px 5px 5px 5px'
                , background: '#f34444'
                // , background:'linear-gradient(315deg, #f5a9ec, #f0a695 90%)'
                 }}><Typography color='secondary' style={{fontSize:14}}>WARNING: This app is still in beta. Use at own risk.</Typography></Card></Grid>
          {/* {(this.state.activePage == "barter") ? */}
          <div>&nbsp;</div>
          <form onSubmit={this.proposeTrade}>
          <Button type='submit' color='secondary' variant='outlined' 
              style={{
                // background:'linear-gradient(315deg, #cf17b9, #e46144, #cf17b9)'
                // background:'linear-gradient(315deg, #f28de6, #cf17b9, #f28de6, #cf17b9)'
                background:'linear-gradient(315deg,  #D00D0D, #f34444, #D00D0D)'
                
                }}><Typography fontSize={18}>Propose Swap</Typography></Button>
          </form>

          &nbsp;
          &nbsp;
          &nbsp;

          <Grid container
            spacing={1}
            flexgrow={1}
            alignItems="center"
            justify="space-evenly"
            // xs={3}
            style={{minWidth:'100%', minHeight: '10vh', padding:'1', maxHeight:'10vh'}}
          >
          

          <form onChange={this.handleEthOfferChange}>
              <FormGroup>
                <TextField 
                  style={{maxWidth:'200px', minWidth:'200px'}}
                  value={this.state.ethOffer} 
                  id="ethoffer" 
                  label="$FWB Offer"
                  type="number" 
                  variant="outlined"/>
              </FormGroup>
            </form>
            </Grid>

            <div>&nbsp;</div>
        

          <Grid container
            spacing={1}
            flexgrow={1}
            alignItems="flex-start"
            justify="space-evenly"
            // xs={3}
            style={{ minHeight: '10vh', padding:'1', maxHeight:'10vh'}}
          >

{/* 
          <Grid container
            spacing={1}
            flexgrow={1}
            alignItems="center"
            justify="space-evenly"
            // xs={3}
            style={{ minHeight: '10vh', padding:'1', maxHeight:'10vh', minWidth:'40%', maxWidth: '40%'}}
          > */}
          {(!this.state.addressEntered) ? 
            <Grid
            container
            spacing={2}
            alignItems="flex-end"
            justify="center"
            style={{ maxHeight:'10vh', minWidth:'40%', maxWidth: '40%'}}
            >

              <form onSubmit={this.handleSubmit}>
              <Card style={{ 
                maxWidth: '80%'
                , minWidth: '80%'
                // , minHeight: '35vh'
                // , maxHeight: '35vh'
                , paddingLeft: 30
                ,paddingRight: 25
                , paddingTop: 10
                , paddingBottom: 30
                , borderRadius: '20px 20px 20px 20px'
                , background: '#D00D0D'
                // , background:'linear-gradient(315deg, #f5a9ec, #f0a695 90%)'
                 }}><Typography color='secondary'>Address</Typography>
              <Card elevation='0' style={{ 
                maxWidth: '80%'
                , minWidth: '80%'
                // , minHeight: '35vh'
                // , maxHeight: '35vh'
                , paddingLeft: 30
                ,paddingRight: 30
                , paddingTop: 10
                , paddingBottom:30
                , borderRadius: '10px 10px 10px 10px'
                , background: '#fceefa'
                // , background:'linear-gradient(315deg, #f5a9ec, #f0a695 90%)'
                 }}>
              <FormGroup>
              <p style={{color:'red', fontSize:24, fontStyle: 'italic'}}>{(this.state.invalidAddress)?'Invalid Address':' '}</p>
              <TextField 
                onChange={this.handleAddressChange} 
                value={this.state.traderAddress} 
                id="outlined-basic" 
                label="" 
                variant="outlined"  />
              <Button type="submit">
                Enter 
              </Button>
              
              </FormGroup>
              </Card>
              </Card>
                </form>
                </Grid>
            :      
            <Card style={{ maxHeight: '13vh'
            , maxWidth: '20%'
            , minWidth: '20%'
            , paddingLeft: 5
            , paddingTop: 8
            , paddingBottom: 5
            , background:'linear-gradient(315deg, #f28de6, #ec8e79, #f28de6, #ec8e79)'//'#F1F1F1' //'#F2A7C0' 
            , alignItems:'flex'
            , justify:'space-evenly'
            }}><Typography fontSize={12}>Address Registered</Typography></Card>
          }
        
          </Grid>
        
          </div>
        </div>

      );
    } else {
      return (
        <div className="App">
          <Bar setActivePage={this.setActivePage}></Bar>
          <div>&nbsp;</div>
          <div>&nbsp;</div>

          <Grid container
            spacing={1}
            flexgrow={1}
            alignItems="flex-start"
            justify="flex-start"
            // xs={3}
            style={{ minHeight: '8vh', padding:'1'}}
          >
            <div style={{minWidth: '10%'}}></div>
            <Button style={{maxWidth:'10vh'}} color='primary' variant='outlined' onClick={()=>{this.setState({inbox: true})}}>Inbox</Button>
            &nbsp;
            <Button color='primary' variant='outlined' onClick={()=>{this.setState({inbox: false})}}>Created</Button>
          </Grid>
          

          <Grid container
            spacing={0}
            flexgrow={1}
            alignItems="flex-start"
            justify="space-evenly"
            // xs={3}
            style={{ minHeight: '0vh', padding:'0'}}
          > 
            
            
            <Card style={{ 
                maxWidth: '80%'
                , minWidth: '80%'
                , minHeight: '70vh'
                , maxHeight: '70vh'
                , paddingLeft: 0
                , paddingTop: 10
                , paddingBottom: 10
                , borderRadius: '20px 20px 20px 20px'
                , background: '#D00D0D'
                // , background: '#f01414'
                // , background:'linear-gradient(315deg, #f5a9ec, #f0a695 90%)'
                 }}>
                  <Grid container
                  flexgrow={1}
                  alignItems="flex-start"
                  justify="flex-start"
                  style={{ minHeight: '5vh'}}
                >
                  <Grid item style={{minWidth: '63%'}}><Typography color='secondary'>Offered Address</Typography></Grid>
                  <Grid item style={{minWidth: '19%'}}><Typography color='secondary'>$FWB</Typography></Grid>
                  </Grid>
                  <div>&nbsp;</div>
                <Grid container
                  flexgrow={1}
                  alignItems="center"
                  justify="space-evenly"
                  // xs={3}
                  style={{ minHeight: '10vh'}}
                >
                  {this.state.inbox?
                  <OfferList
                    type={true}
                    offerArray={this.state.askArray}
                    acceptTrade={this.acceptTrade}
                    >
                  </OfferList>
                  :
                  <OfferList
                    type={false}
                    offerArray={this.state.offerArray}
                    acceptTrade={this.cancelTrade}
                    >
                  </OfferList>
                  }
                </Grid>
            </Card>
          </Grid>
          
          
          
        </div>
        
      );
    }
  }
}

export default App;
