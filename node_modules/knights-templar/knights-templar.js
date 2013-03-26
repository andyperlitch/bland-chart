var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');
var _ = require('underscore');

// Main make method
function make(path, type) {
    
    // Default type
    type = type || 'hbs'
    
    // Check file existence
    if (! fs.existsSync(path) ) throw new Error("Template file could not be found. Given path: `"+path+"`. cwd: `"+process.cwd()+"`.");
    
    // Read the file
    var file_contents = fs.readFileSync(path).toString('utf8');
    
    // Compile with appropriate library
    switch(type) {
        case "handlebars":
        case "Handlebars":
        case "hbs":
            return handlebars.compile(file_contents);
        
        case "_":
        case "underscore":
        case "erb":
            return _.template(file_contents);
    }
}

exports.make = make