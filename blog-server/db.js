const MongoClient = require('mongodb').MongoClient;
const connectionURL = 'mongodb://localhost:27017';
const databaseName = 'BlogServer';

// use one global connection (connection pooling)
let client = null;

// create a connection to the URL
module.exports.connect = async function ()
{
    try
    {
        // if we've already established a connection
        if (client) return;

        // create a new connection
        client = new MongoClient(connectionURL, { useUnifiedTopology: true });
        await client.connect();
    }
    catch (err)
    {
        client = null;
        console.log("Error connecting to database");
        console.log(err);
    }
}

// get database using pre-established connection
module.exports.db = function ()
{
    return client.db(databaseName);
}

// close open connection
module.exports.close = function ()
{
    if (client)
    {
        client.close();
        client = null;
    }
}
