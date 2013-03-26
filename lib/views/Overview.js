var BaseView = require('./BaseView');
var Slider = require('./Slider');

var Overview = BaseView.extend({

    template: ,

    initialize: function() {
        
        
        
    },
    
    render: function() {
        
        var self = this;
        
        // Get dimensions
        var height = this.model.get("overview_height");
        var width = this.model.get("viewport_width");
        
        // Fill markup
        this.$el.html(this.template({}));

        // Create svg canvas, removing any previous canvas
        if ( this.canvas && typeof this.canvas.remove === "function" ) {
            this.canvas.remove();
            delete this.canvas;
        }
        this.canvas = Raphael(
            this.$(".overview-canvas").css({width: width+"px", height: height+"px"})[0], 
            width, 
            height,
            function() {
                self.insertView("slider")
            }
        );
        
        // Create the scrolling element
        this.setView("slider", new Slider({ model: this.model, el: this.$(".overview-slider")[0] }) );
        
        // clear canvas and make sure width and height are updated
        this.$el.css({"width":width+"px", "height":height+"px"});
        
        return this;
    }
    
});

exports = module.exports = Overview