// Wrapper for a Raphael circle elements
var PathPoint = Backbone.View.extend({
    
    initialize: function(options) {
        this.canvas = options.canvas;
        this.chart = options.chart;
        this.points = this.canvas.set();
        this.on("hover", this.onhover );
        this.on("mouseout", this.onmouseout );
        this.r = 5;
        this.r_hover = 10;
    },
    
    // Adds a Raphael circle to this view's internal hash
    addPoint:function(circle) {
        circle.attr({"r":this.r});
        this.points.push(circle);
    },
    
    onhover: function() {
        this.allpointviews.forEach(function(view){view.onmouseout()});
        this.points.animate({"r":this.r_hover}, 500, "elastic");
    },
    
    onmouseout: function() {
        this.points.attr({"r":this.r});
    }
    
});
exports = module.exports = PathPoint