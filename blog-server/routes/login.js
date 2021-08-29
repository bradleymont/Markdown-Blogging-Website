// router for URLs starting with /login
var express = require('express');
var bcrypt = require('bcryptjs');
var jsonwebtoken = require('jsonwebtoken');
var mongoClient = require('../db');
var router = express.Router();

// GET /login
// optional query parameter: redirect=:redirect (passed as query parameter to POST request when user submits)
// Return an authentication page where the user can input their username and password
router.get('/', (req, res, next) => {
    res.render('login', { redirect: req.query.redirect, username: "", password: "" });
});

// POST /login
// mandatory query parameters: username=:username and password=:password
// optional query parameter: redirect=:redirect (redirects to this URL)
// Authenticates username/password combo and sets an authentication session cookie if successful
router.post('/', async (req, res, next) => {
    try
    {
        let username = req.body.username;
        let password = req.body.password;
        let redirect = req.body.redirect;

        // if username or password query parameters are omitted
        if (!username || !password)
        {
            res.status(400);
            res.send("Bad Request: POST /login request must include username and password query parameters");
            return;
        }

        // retrieve the user's password (hashed) from the BlogServer database
        let db = mongoClient.db();
        let UsersCollection = db.collection('Users');
        let matchingUser = await UsersCollection.findOne({ 'username': username },
                                                         { 'projection': { '_id': 0, 'password': 1 }}
        );

        // if the user doesn't exist in the BlogServer database
        // return an HTML form with username and password input fields in the response body
        if (!matchingUser)
        {
            res.status(401);
            res.render('login', { username, password, redirect });
            return;
        }

        // storedPassword = the user's actual password stored in the database
        storedPassword = matchingUser.password;

        // compare the hashed password in the database with the unhashed password provided by the user
        let correctPassword = bcrypt.compareSync(password, storedPassword);

        // if the username/password combo doesn't match our records
        // return an HTML form with username and password input fields in the response body
        if (!correctPassword)
        {
            res.status(401);
            res.render('login', { username, password, redirect });
            return;
        }

        // from here on, assume that they inputted a valid username/password combo

        // 1. set an authentication session cookie in JSON Web Token (JWT) 

        // set the expiration date to be two hours from now
        // Note: Date.now() gives the current time in milliseconds since the Unix epoch
        // we want our time to be two hours after Date.now() in seconds
        let currTime = Date.now() / 1000; // convert current time to seconds
        let expiration = currTime + 7200;// add two hours (7200 seconds) to the current time

        let jwtHeader = {
            "alg": "HS256",
            "typ": "JWT"
        };

        let jwtPayload = {
            "exp": expiration,
            "usr": username
        };

        let secretKey = "C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c";

        // get the jsonwebtoken
        let jwt = jsonwebtoken.sign(jwtPayload, secretKey, { header: jwtHeader });
       
        // set it as the value of the cookie jwt
        res.cookie('jwt', jwt);

        // 2a. redirect to redirect if it was provided in the request
        if (redirect)
        {
            res.redirect(redirect);
            return;
        }

        // 2b. otherwise return status code 200 (OK) with the body saying that the authentication was successful
        res.status(200);
        res.send("Authentication was successful");
    }
    catch (err)
    {
        next(err);
    }
});

module.exports = router;