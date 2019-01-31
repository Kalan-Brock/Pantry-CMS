const config = require('../config/config.js');
console.log(global.gConfig);
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const fs = require('fs-extra');
const ejs = require("ejs");
const ampify = require('ampify');
const sm = require('sitemap');

let sitemap = sm.createSitemap ({
    hostname: global.gConfig.siteUrl,
    cacheTime: 600000
});

// The homepage.
let html = ejs.renderFile('./views/home.ejs',
    {
        layout: false
    },
    {
        rmWhitespace: true,
        async: false
    },
    function(err, str)
    {
        fs.outputFile("./public/optimized/index.html", str, function(err) {
            if(err)
                console.log(err);
        });
    });

sitemap.add({url: '/', changefreq: 'weekly',  priority: 0.9});


// Each page in the database, if flagged as "should_cache".
let pages = db.get('pages').value();

for(let i=0; i<pages.length; i++) {
    let slug = pages[i].slug;
    let path = "./public/optimized/" + slug + ".html";
    let amppath = "./public/amp/" + slug + ".html";
    sitemap.add({url: '/' + slug, changefreq: 'weekly',  priority: 0.7});


    if(global.gConfig.generateStaticFiles && pages[i].should_cache) {

        let html = ejs.renderFile('./views/' + pages[i].layout + '.ejs',
            {
                layout: false,
                page: pages[i]
            },
            {
                rmWhitespace: true,
                async: false
            },
            function (err, str) {
                fs.outputFile(path, str, function (err) {
                    if (err)
                        console.log(err);
                });
            });

        if(global.gConfig.generateAMP && pages[i].should_amp) {
            let amphtml = ejs.renderFile('./views/amp/page.ejs',
                {
                    layout: false,
                    page: pages[i]
                },
                {
                    rmWhitespace: true,
                    async: false
                },
                function (err, str) {
                    fs.outputFile(amppath, ampify(str, {cwd: 'public'}));
                });
        }
    }
}

if(global.gConfig.hasBlog) {
// Blog Main Blog Page
    let posts = db.get('blog_posts').value();

    if (posts === undefined) {
        posts = {};
    }

    let bloghtml = ejs.renderFile('./views/blog.ejs',
        {
            layout: false,
            pageTitle: "Blog",
            posts: posts
        },
        {
            rmWhitespace: true,
            async: false
        },
        function (err, str) {
            fs.outputFile("./public/optimized/blog/index.html", str, function (err) {
                if (err)
                    console.log(err);
            });
        });

    sitemap.add({url: '/blog/', changefreq: 'weekly',  priority: 0.8});

    for(let i=0; i<posts.length; i++) {
        if(global.gConfig.generateStaticFiles && posts[i].should_cache) {
            let slug = posts[i].slug;
            let path = "./public/optimized/blog/" + slug + ".html";
            let amppath = "./public/amp/blog/" + slug + ".html";
            sitemap.add({url: '/blog/' + slug, changefreq: 'weekly',  priority: 0.5});

            let html = ejs.renderFile('./views/post.ejs',
                {
                    layout: false,
                    post: posts[i]
                },
                {
                    rmWhitespace: true,
                    async: false
                },
                function (err, str) {
                    fs.outputFile(path, str, function (err) {
                        if (err)
                            console.log(err);
                    });
                });

            if(global.gConfig.generateAMP && posts[i].should_amp) {
                let amphtml = ejs.renderFile('./views/amp/post.ejs',
                    {
                        layout: false,
                        post: posts[i]
                    },
                    {
                        rmWhitespace: true,
                        async: false
                    },
                    function (err, str) {
                        fs.outputFile(amppath, ampify(str, {cwd: 'public'}));
                    });
            }
        }
    }
}

fs.outputFile("./public/sitemap.xml", sitemap.toXML(), function (err) {
    if (err)
        console.log(err);
});
