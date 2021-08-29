// router for URLs starting with /blog
var express = require('express');
var router = express.Router();
var mongoClient = require('../db');
var commonmark = require('commonmark');

// function that takes in a string in markdown format and returns its HTML version
function compileMarkdown(md)
{
    // use commonmark to compile markdown into HTML
    let reader = new commonmark.Parser();
    let writer = new commonmark.HtmlRenderer();
    
    let parsed = reader.parse(md);
    return writer.render(parsed);
}

// GET /blog/:username/:postid
// Return an HTML-formatted page that shows the blog post with postid written by username.
router.get('/:username/:postid', async (req, res, next) => {
    try
    { 
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
        let blogPost =  await PostsCollection.findOne({ 'username': req.params.username, 'postid': postid });

        if (blogPost == null)
        {
            res.status(404);
            res.send("Error: no document with matching username and postid");
            return;
        }

        // compile markdown into HTML
        let title = compileMarkdown(blogPost.title);
        let body = compileMarkdown(blogPost.body);

        // get created and modified time (in milliseconds since Unix epoch)
        let created = new Date(blogPost.created).toString().substring(0,25);
        let modified = new Date(blogPost.modified).toString().substring(0,25);

        res.render('blog', {title, body, created, modified });
    }
    catch (err)
    {
        next(err);
    }
});

// GET /blog/:username
// optional query parameter: start (all posts displayed must have postid >= start)
// Return an HTML page that contains first 5 blog posts by username.
router.get('/:username', async (req, res, next) => {
    try
    {
        // check if the postid is a number
        let startPostid = 0; // by default use start=0

        if (req.query.start)
        {
            if (isNaN(req.query.start))
            {
                res.status(400);
                res.send("Bad Request: start query parameter must be a number");
                return;               
            }
            startPostid = parseInt(req.query.start);
        }

        let db = mongoClient.db();
        let PostsCollection = db.collection('Posts');
        let firstFivePosts = await PostsCollection.find({ 
                                                            'username': req.params.username,
                                                            'postid': { $gte: startPostid } 
                                                        }, 
                                                        {
                                                            'limit': 6,
                                                            'sort': [['postid', 'ascending']]
                                                        }).toArray();

        if (!firstFivePosts.length)
        {
            res.status(404);
            res.send("Error: no documents with matching username whose postid is " + startPostid + " or above");
            return;
        }

        // we render a "next" button if there are more posts after the 5 we are displaying
        let renderNext = false;
        let nextUrl = null; // URL to display the next 5 posts

        // if our search result returned 6 documents, then that means there are more posts we can display
        if (firstFivePosts.length == 6)
        {
            renderNext = true;
            let nextPost = firstFivePosts.pop(); // remove the 6th document - it was only to see if we should render a next button
            nextUrl = req.originalUrl + "?start=" + nextPost.postid;
        }

        // compile each post from markdown into HTML
        firstFivePosts = firstFivePosts.map(post => {
            return {
                title: compileMarkdown(post.title),
                body: compileMarkdown(post.body),
                created: new Date(post.created).toString().substring(0,25),
                modified: new Date(post.modified).toString().substring(0,25)
            };
        });

        res.render('blogList', { posts: firstFivePosts, renderNext, nextUrl });

    }
    catch (err)
    {
        next(err);
    }
});

module.exports = router;