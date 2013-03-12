var Slider = Backbone.View.extend({

    initialize: function() {
        
    },
    
    template: _.template('<div class="slider-lefthandle"></div><div class="slider-righthandle"></div>'),
    
    render: function() {
        return this;
    }
    
});

exports = module.exports = Slider