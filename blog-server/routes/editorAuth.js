// router for authenticating requests to /editor/
var express = require('express');
var router = express.Router();
var jsonwebtoken = require('jsonwebtoken');

// checks if a request contains a valid jwt cookie
// returns true if there is a valid jwt cookie
function checkValidJWT(cookies)
{
    // if the request doesn't contain a jwt cookie
    if (!Object.keys(cookies).includes('jwt'))
    {
        return false;
    }

    // try to decode the jsonwebtoken
    let encodedJWT = cookies.jwt;
    let secretKey = "C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c";
    let decodedJWT = null;

    try
    {
        decodedJWT = jsonwebtoken.verify(encodedJWT, secretKey);
    }
    // if the if the jsonwebtoken is expired, an error will be thrown 
    catch (err)
    {
        return false;
    }

    return true;
}

// any request to /editor/
// if a request made to /editor/ doesn't contain a valid JWT, then
// redirect to /login?redirect=/editor/
router.all('/*', (req, res, next) => {
    // if the request contains a valid JWT
    if (checkValidJWT(req.cookies))
    {
        // call the next handler to load the angular app
        next();
    }
    else // invalid JWT
    {
        // redirect to /login?redirect=/editor/
        res.redirect('/login?redirect=/editor/');
    }
    return;
});

module.exports = router;
