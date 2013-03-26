knights-templar
==========
compile ye javascript templates from doth external files in node.js.

##usage

    var kt = require('knights-templar');
    var template = kt.make(__dirname+'template.html', 'hbs');
    var markup = template({ name: 'andy', age: 24 });

##methods

###kt.make(path,[type])
compiles content from a file located at `path` into a template function specified by `type` (defaults to Handlebars).

##types
- **'hbs'** - Handlebars
- **'_'** - Underscore templates (erb-style)


##license
MIT