var kt = require('knights-templar');
var template = kt.make(__dirname+'/template.html', 'hbs');
var markup = template({ name: 'andy', age: 24 });
console.log(markup);