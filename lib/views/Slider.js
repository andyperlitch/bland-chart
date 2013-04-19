var kt = require('knights-templar');
var Slider = Backbone.View.extend({

    initialize: function() {
        
    },
    
    template: kt.make(__dirname+'/../templates/Slider.html','_'),
    
    render: function() {
        return this;
    }
    
});

exports = module.exports = Slider