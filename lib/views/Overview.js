var BaseView = require('./BaseView');
var kt = require('knights-templar');
var util = require('../util');
var Slider = require('./Slider');

var Overview = BaseView.extend({

    template: kt.make(__dirname+'/../templates/Overview.hbs'),

    initialize: function() {
        
        this.slider = new Slider({ model: this.model });
        this.listenTo(this.model, "change:mode",this.render);
        this.listenTo(this.model.plots, "update", this.render);
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
                self.assign({
                    '.overview-slider': self.slider
                })
            }
        );
        
        
        // clear canvas and make sure width and height are updated
        this.$el.css({"width":width+"px", "height":height+"px"});
        
        // draw the lines in the overview
        // this.drawData(this.collection);
        
        return this;
    },
    
    drawData: function(data) {
        console.log("this",this);
        if (!data.length){
            var rtext = this.canvas.text(this.model.get("viewport_width")/2,10,"Waiting for Data...");
            util.addClass(rtext, "waiting-text");
            return;
        }
    }
    
});

exports = module.exports = Overview