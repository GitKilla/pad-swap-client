import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import NFTCard from './NFTCard';
import OfferIcon from './OfferIcon';
import { CardHeader } from '@material-ui/core';
import Offer from './Offer';
// import LinearGradient from 'react-native-linear-gradient';

const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
  }));

function printOffers(offerArray, type, acceptTrade) {
    var cards = [];
    if(offerArray.length <= 0) {
    cards.push(<div><div>&nbsp;</div><Typography>No Offers {type?'In Inbox':'Created'}</Typography></div>)
    }
    for(var i = 0; i < offerArray.length; i++) {
        cards.push( <Offer
            key={i}
            offerId={offerArray[i][0]}
            offerVal={offerArray[i][1]}
            otherAddress={offerArray[i][2]}
            type={type}
            acceptTrade={acceptTrade}
            maxWidth="100%" maxHeight='20vh'
            minWidth="100%"
          ></Offer>)
    }
    return cards;
}


export default function NFTCardGrid(props) {
  const classes = useStyles();

  var acceptTrade = (offerId, askContracts) => {
    props.acceptTrade(offerId, askContracts)
  }

  return (

    <Grid
        container
        spacing={5}
        alignItems="center"
        justify="center"
        style={{ maxHeight: '90%', maxWidth: '100%' }}
        >
      <Card elevation='0' style={{ 
                maxWidth: '95%'
                , minWidth: '95%'
                , minHeight: '60vh'
                , maxHeight: '60vh'
                , paddingLeft: 10
                , paddingTop: 0
                , paddingBottom: 10
                , borderRadius: '20px 20px 20px 20px'
                , background: '#fceefa'
                // , background:'#f7d7f3'
                , alignItems: 'center'
                , overflow:'auto' }}>
        <Grid
        container
        spacing={5}
        alignItems="center"
        justify="center"
        style={{ maxHeight: '90%', maxWidth: '100%', paddingTop: 20, paddingBottom: 20 }}
        >          
        {printOffers(props.offerArray, props.type, acceptTrade)}
        </Grid>
        </Card>
        </Grid>
        
  );
}