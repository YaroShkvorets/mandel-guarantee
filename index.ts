import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
const fetch = require('node-fetch');

interface TrxStatus {
  state: string;
  block_number: number;
  irreversible_number: number;
  head_number: number;
}

function timeout( ms: number ): Promise<void> {
    return new Promise((resolve) => setTimeout(() => resolve(), ms ))
}

const NODE_ENDPOINT = "https://jungle4.api.eosnation.io/";
const rpc = new JsonRpc(NODE_ENDPOINT, { fetch });

const signatureProvider = new JsSignatureProvider(["5KKFLNNi1zh3TUGeSAYt977yfUjLQ78dWSYautR1A5ooFYBBcdm"]);
const api = new Api({rpc: rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

const ACCOUNT = 'slaslaslasla'

async function testTrx( ) {

    return await api.transact({
      actions: [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
        {
          actor: ACCOUNT,
          permission: 'active',
        }],
        data: {
          from: ACCOUNT,
          to: 'eosio.ram',
          memo: 'buy ram',
          quantity: '0.0010 EOS'
        },
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });
}

async function getTrxStatus( trx_id: string): Promise<TrxStatus>{

  const response = await fetch(`${NODE_ENDPOINT}/v1/chain/get_transaction_status`, {
    method: 'post',
    body: JSON.stringify({id: trx_id}),
    headers: {'Content-Type': 'application/json'}
  });
  return await response.json();
}

(async () => {

    const {transaction_id} = await testTrx();
    console.log("Pushed trx: ", transaction_id);
    while(true){
      const status = await getTrxStatus(transaction_id);
      const irreversibleBlocks = status.head_number - status.irreversible_number;
      const passedBlocks = status.head_number - status.block_number;
      console.log(`State: ${status.state} Passed: ${passedBlocks/2} seconds, Left: ${(status.block_number - status.irreversible_number)/2} seconds, Progress: ${(100*passedBlocks/irreversibleBlocks).toFixed(2)}%`)
      if(status.state == "IRREVERSIBLE") break;
      await timeout(10000)
    }
    console.log('🎉')

})();