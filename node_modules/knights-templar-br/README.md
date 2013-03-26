knights-templar-br
==========
inline ye compiled templates with browserify and the [knights-templar](https://github.com/andyperlitch/knights-templar) module.

##usage

    // template.html
    <p><strong>{{name}}</strong> - age {{age}}
    
    // file1.js
    var kt = require('knights-templar');
    var template = kt.make(__dirname+'template.html', 'hbs');
    var markup = template({ name: 'andy', age: 24 });
    console.log(markup);
    
    // build.js
    var browserify = require('browserify');
    var fs = require('fs');
    var ktb = require('knights-templar-br');
    var bundle = browserify('./file1.js')
    .transform(ktb)
    .bundle()
    .pipe(fs.createWriteStream('./bundle.js'));


Keep in mind that for Handlebars, the bundle will only work if the Handlebars-runtime (or full Handlebars library) is included on the page. Both are available at the [Handlebars website](http://handlebarsjs.com/). So, using the above as an example, your html should look something like this:

    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <title></title>
        </head>
        <body>
            
            
            <script src="handlebars-runtime.js"></script>
            <script src="bundle.js"></script>
        </body>
    </html>

##license
MIT