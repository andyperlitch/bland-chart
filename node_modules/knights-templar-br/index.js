var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');
var through = require('through');
var falafel = require('falafel');
var unparse = require('escodegen').generate;

module.exports = function (file) {
    var data = '';
    var precompNames = {};
    var vars = [ '__filename', '__dirname' ];
    var dirname = path.dirname(file);
    
    return through(write, end);
    
    function write (buf) { data += buf }
    function end () {
        var tr = this;
        var pending = 0;
        
        var output = falafel(data, function (node) {
            // Check for `var kt = require('knights-templar') calls 
            if (isRequire(node) && node.arguments[0].value === 'knights-templar'
            && node.parent.type === 'VariableDeclarator'
            && node.parent.id.type === 'Identifier') {
                // remove them
                precompNames[node.parent.id.name] = true;
                node.parent.parent.update('');
            }
            // Check for calls to methods on the precomp objects
            if (node.type === 'CallExpression'
            && node.callee.type === 'MemberExpression'
            && node.callee.object.type === 'Identifier'
            && precompNames[node.callee.object.name]
            && node.callee.property.type === 'Identifier'
            && node.callee.property.name === 'make' ) {
                
                // Get the contents of the file named
                var args = node.arguments;
                var t = 'return ' + unparse(args[0]);
                var fpath = Function(vars, t)(file, dirname);
                var enc = 'utf8';
                var type = unparse(args[1]).replace(/['"]/g, "") || 'hbs';
                ++ pending;
                fs.readFile(fpath, enc, function (err, src) {
                    // check for error
                    if (err) return tr.emit('error', err);
                    
                    // variable to hold the node's replacement
                    var template = '';
                    
                    // switch based on the template method called
                    switch(type) {
                        

                        case "_": // Underscore erb-style
                            
                            
                            
                        break;
                        
                        case "_stache": // Underscore {{mustache}}-style
                            
                            
                            
                        break;
                        
                        case "hbs": 
                            // Handlebars
                            template = 'Handlebars.template('+handlebars.precompile(src)+')';
                            break;
                    }
                    
                    // update the node
                    
                    node.update(template);
                    
                    // check if this is the last one
                    if (--pending === 0) finish();
                    
                });
                
                
                
            }
        });
        
        if (pending === 0) finish();
        
        function finish () {
            tr.queue(String(output));
            tr.queue(null);
        }
    }
};

function isRequire (node) {
    var c = node.callee;
    return c
        && node.type === 'CallExpression'
        && c.type === 'Identifier'
        && c.name === 'require'
    ;
}
