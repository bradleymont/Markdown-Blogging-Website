// router for URLs starting with /api
var express = require('express');
var jsonwebtoken = require('jsonwebtoken');
var mongoClient = require('../db');
var router = express.Router();

// checks if a request contains a valid jwt cookie with matching username
// returns error message, or null if authorization is successful
function authorizeRequest(cookies, urlUsername)
{
    // if the request doesn't contain a jwt cookie
    if (!Object.keys(cookies).includes('jwt'))
    {
        return "Unauthorized: request doesn't contain any jwt cookie";
    }

    // try to decode the jsonwebtoken
    let encodedJWT = cookies.jwt;
    let secretKey = "C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c";
    let decodedJWT = null;

    try
    {
        decodedJWT = jsonwebtoken.verify(encodedJWT, secretKey);
    }    
    catch (err)
    {
        // if the jsonwebtoken is expired
        if (err instanceof jsonwebtoken.TokenExpiredError)
        {
            return "Unauthorized: jwt cookie is expired";
        }
        // if we encountered any other errors while decoding the jsonwebtoken
        else
        {
            return "Unauthorized: error verifying jwt cookie";
        }
    }
    
    // check the username of the jwt
    let jwtUsername = decodedJWT.usr;
    
    // if the username in jwt does not match the username in the URL
    if (jwtUsername != urlUsername)
    {
        return "Unauthorized: the username in jwt does not match the username in the URL";
    }

    return null;
}

// GET /api/:username
// return all blog posts by username
router.get('/:username', async (req, res, next) => {
    try
    {
        // protect REST API behind authorization
        let authenticationError = authorizeRequest(req.cookies, req.params.username);

        // if the rest is not authorized
        if (authenticationError)
        {
            res.status(401);
            res.send(authenticationError);
            return;
        }

        let db = mongoClient.db();
        let PostsCollection = db.collection('Posts');
        let blogPosts = await PostsCollection.find({ 'username': req.params.username }, 
                                                   { 'projection': { '_id': 0 } }).toArray();
        res.send(blogPosts);
        return;
    }
    catch (err)
    {
        next(err);
    }
});

// GET /api/:username/:postid
// return the blog post with postid by username
router.get('/:username/:postid', async (req, res, next) => {
    try
    {
        // protect REST API behind authorization
        let authenticationError = authorizeRequest(req.cookies, req.params.username);

        // if the rest is not authorized
        if (authenticationError)
        {
            res.status(401);
            res.send(authenticationError);
            return;
        }

        // check if the postid is a number
        if (isNaN(req.params.postid))
        {
            res.status(400);
            res.send("Bad Request: postid must be a number");
            return;
        }

        let postid = parseInt(req.params.postid);

        let db = mongoClient.db();
        let PostsCollection = db.collection('Posts');
        let blogPost =  await PostsCollection.findOne({ 'username': req.params.username, 'postid': postid },
                                                      { 'projection': { '_id': 0 } });

        if (blogPost == null)
        {
            res.status(404);
            res.send("Error: no blog post with matching username and postid");
            return;
        }

        res.send(blogPost);
        return;
    }
    catch (err)
    {
        next(err);
    }
});

// POST /api/:username/:postid
// insert a new blog post with username, postid, title, and body from request
router.post('/:username/:postid', async (req, res, next) => {
    try
    {
        // protect REST API behind authorization
        let authenticationError = authorizeRequest(req.cookies, req.params.username);

        // if the rest is not authorized
        if (authenticationError)
        {
            res.status(401);
            res.send(authenticationError);
            return;
        }

        let username = req.params.username;

        // check if the postid is a number
        if (isNaN(req.params.postid))
        {
            res.status(400);
            res.send("Bad Request: postid must be a number");
            return;
        }

        let postid = parseInt(req.params.postid);

        let { title, body } = req.body;

        // if title or body are omitted from the request body
        if (title == null || body == null)
        {
            res.status(400);
            res.send("Bad Request: must include title and body in request body");
            return;
        }

        let db = mongoClient.db();
        let PostsCollection = db.collection('Posts');

        // check if a blog post with the same postid by username already exists
        let existingBlogPost =  await PostsCollection.findOne(
            { 'username': username, 'postid': postid },
            { 'projection': { '_id': 0 } });

        // if a post with that username and postid already exists
        if (existingBlogPost)
        {
            res.status(400);
            res.send("Bad Request: a blog post by that username with that postid already exists");
            return; 
        }

        // insert a new blog post

        // set created and modified fields to the current time
        let created = modified = Date.now();
        
        let insertResult = await PostsCollection.insertOne(
            { 'postid': postid, 'username': username, 'created': created, 'modified': modified, 'title': title, 'body': body }
        );

        // assume server-side error if we didn't successfully insert a single document
        if (!insertResult || insertResult.insertedCount != 1)
        {
            res.status(500);
            res.send("Server error: did not successfully insert a new blog post");    
            return;     
        }

        // if the insertion was successful
        res.status(201);
        res.send("Successfully inserted new blog post");
        return;
    }
    catch (err)
    {
        next(err);
    }
});

// PUT /api/:username/:postid
// update the existing blog post with postid by username with the title and body values from the request
router.put('/:username/:postid', async (req, res, next) => {
    try
    {
        // protect REST API behind authorization
        let authenticationError = authorizeRequest(req.cookies, req.params.username);

        // if the rest is not authorized
        if (authenticationError)
        {
            res.status(401);
            res.send(authenticationError);
            return;
        }

        let username = req.params.username;

        // check if the postid is a number
        if (isNaN(req.params.postid))
        {
            res.status(400);
            res.send("Bad Request: postid must be a number");
            return;
        }

        let postid = parseInt(req.params.postid);

        let { title, body } = req.body;

        // if title or body are omitted from the request body
        if (title == null || body == null)
        {
            res.status(400);
            res.send("Bad Request: must include title and body in request body");
            return;
        }

        // set the modified time to the current time
        let modified = Date.now();

        // update matching blog post in database
        let db = mongoClient.db();
        let PostsCollection = db.collection('Posts');
        let updateResult = await PostsCollection.updateOne(
            { 'username': username, 'postid': postid }, 
            { $set: { 'title': title, 'body': body, 'modified': modified } });

        // assume server-side error if updateResult is null or if we updated multiple documents
        if (!updateResult || updateResult.modifiedCount > 1)
        {
            res.status(500);
            res.send("Server error: did not successfully update a single blog post");    
            return;     
        }

        // if there is no blog post with postid by username
        if (updateResult.matchedCount == 0)
        {
            res.status(400);
            res.send("Bad Request: There is no blog post with postid by username");    
            return;         
        }

        // if the update was successful
        res.status(200);
        res.send("Successfully updated blog post");
        return;
    }
    catch (err)
    {
        next(err);
    }
});

// DELETE /api/:username/:postid
// delete the existing blog post with postid by username from the database
router.delete('/:username/:postid', async (req, res, next) => {
    try
    {
        // protect REST API behind authorization
        let authenticationError = authorizeRequest(req.cookies, req.params.username);

        // if the rest is not authorized
        if (authenticationError)
        {
            res.status(401);
            res.send(authenticationError);
            return;
        }

        let username = req.params.username;

        // check if the postid is a number
        if (isNaN(req.params.postid))
        {
            res.status(400);
            res.send("Bad Request: postid must be a number");
            return;
        }

        let postid = parseInt(req.params.postid);

        // delete matching post from database
        let db = mongoClient.db();
        let PostsCollection = db.collection('Posts');
        let deleteResult = await PostsCollection.deleteOne({ 'username': username, 'postid': postid });

        // if deleteResult is null, assume server-side error
        if (!deleteResult)
        {
            res.status(500);
            res.send("Server error: did not successfully delete a single blog post");    
            return;
        }

        // if there is no such post with that username and postid
        if (deleteResult.deletedCount != 1)
        {
            res.status(400);
            res.send("Bad Request: There is no blog post with postid by username");
            return;
        }

        // if the deletion was successful
        res.status(204);
        res.send("Successfully deleted blog post");
        return;
    }
    catch (err)
    {
        next(err);
    }
});

module.exports = router;
