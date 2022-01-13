
import handler from "./handler-lib.js";
import dynamoDb from "./dynamodb-lib.js";
import { APIGatewayProxyHandler } from "aws-lambda";
import Moralis from "moralis/node";
import * as uuid from "uuid";
import AWS from "aws-sdk";
// ES6 Minimized
//import Moralis from 'moralis/dist/moralis.min.js';

//const dynamoDb= new AWS.DynamoDB.DocumentClient();

export const hello = async (event, context) => {
  /* Moralis init code */
  const serverUrl = "https://fsqz0yqphja6.usemoralis.com:2053/server";
  const appId = "0sXcWQe5200BwYQui69K37phdT4dHpDaUKs7kUl4";
  Moralis.start({ serverUrl, appId });

  //https://test.com/hello?name=roger&name=flavio
  //https://f3xg450rfe.execute-api.us-east-1.amazonaws.com/dev/hello?address=0x4958cde93218e9bbeaa922cd9f8b3feec1342772&chain=eth
  const address_string=event["queryStringParameters"]['address'];
  const chain_name=event["queryStringParameters"]['chain'];
  const check_existence={
    TableName: process.env.tableName,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    Key: {
      walletPubKey: address_string, // The id of the author
      chain_name: chain_name, // The id of the note from the path
    },
  };
  const ans = dynamoDb.get(check_existence);
  if (!ans.Item) {
     console.log("There is not such object in the table. We will have to fetch it using moralis.....\n");
      const ethNFTs = await Moralis.Web3API.account.getNFTs({ chain : chain_name, address :address_string});
      const params = {
        TableName: process.env.tableName,
        Item: {
          // The attributes of the item to be created
          walletPubKey: address_string, // The id of the author
          chain_name: chain_name, // A unique uuid
          info: JSON.stringify(ethNFTs,null,2), // Parsed from request body // Parsed from request body
          //createdAt: Date.now(), // Current Unix timestamp
        },  
      };
      await dynamoDb.put(params);
      const newResult = await dynamoDb.get(check_existence);
      if (!newResult.Item) {
        throw new Error("Item not found in the table even after putting it just before this step.");
      }
      return {
        statusCode: 200,
        body: JSON.stringify(newResult.Item,null,2),
      };
  }
  else {
    console.log("Such an object exits in the table. Fetching from inside it...\n");
    return {
      statusCode: 200,
      body: JSON.stringify(ans.Item,null,2),
    };
  }
};

const message = ({ time, ...rest }) => new Promise((resolve, reject) =>
  setTimeout(() => {
    resolve(`${rest.copy} (with a delay)`);
  }, time * 1000)
);
