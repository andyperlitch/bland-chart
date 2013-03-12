var util = require('../util');
var Viewport = Backbone.View.extend({

    initialize: function() {
        
        this.listenTo(this.model, "change:mode",this.render);
        this.listenTo(this.collection, "add", this.render);
        
    },
    
    render: function() {
        if (this.model.get('no_render')) return;
        var self = this;
        
        // Get dimensions
        var height = this.model.get("viewport_height");
        var width = this.model.get("viewport_width");
        
        // Create svg canvas, removing any previous
        if ( this.canvas && typeof this.canvas.remove === "function" ) {
            this.canvas.remove();
            delete this.canvas;
        }
        this.canvas = Raphael(
            this.$el.empty().css({width: width+"px", height: height+"px"})[0], 
            width, 
            height
        );
        this.drawGrid(this.model.plots);
        this.drawData(this.collection);
        
        return this;
    },
    
    drawGrid: function(plots) {
        if (!plots.length) return;
        // Use markers of first plot to create lines
        var plot = plots.at(0);
        plot.markers.each(function(marker){
            if (marker.get("mark_class") === "") {
                var y_value = this.model.get("viewport_height") - parseInt(marker.get("bottom")) - 1;
                var path = ["M","0",y_value, "L", this.model.get("viewport_width"), y_value].join(",");
                var gridline = this.canvas.path(path);
                util.addClass(gridline, "gridline");
                gridline.removeData();
            }
        }, this);
        
    },
    
    drawData: function(data) {
        if (!data.length){
            // TODO: display "waiting for data"
            return;
        }
        var x_axis_key = this.model.get('x_axis_key');
        var extrema = this.model.getViewportXExtrema();
        var plotPoints = [];
        data.each(function(point){
            var x_value = point.get(x_axis_key);
            if ( x_value >= extrema.min && x_value <= extrema.max ) {
                plotPoints.push(point);
            }
        });
        switch(this.model.get("mode")){
            default:
                this.drawLine(plotPoints, x_axis_key, this.canvas);
            break;
        }
    },
    
    drawLine: function(plotPoints, x_axis_key, canvas) {
        
        var self = this;
        var toX = self.model.toViewportX;
        
        // Loop through the plots
        this.model.plots.each(function(plot){
            var toY = plot.toViewportY;
            var y_axis_key = plot.get('key');
            var path = ["M"];
            var pointset = canvas.set();
            
            // Loop through the points
            plotPoints.forEach(function(point){
                // Build on the path
                var x = toX.call( self.model, point.get( x_axis_key ) );
                var y = toY.call( plot, point.get( y_axis_key ) );
                path.push(x+","+y,"L");
                
                // Create point object
                var pathpoint = canvas.circle(x,y,5);
                util.addClass(pathpoint, "plotpoint").removeData();
                pointset.push(pathpoint);
                self.delegatePointEvents(pathpoint);
            });
            path.pop();
            if (plotPoints.length > 1) {
                var line = canvas.path(path.join(""));
                util.addClass(line, "plotline")
                line.removeData();
                var line_ds = window.line_ds = line.clone();
                util.addClass(line_ds, "plotline_ds").transform("T1,1");
                line.attr("stroke", plot.get('color'));
                line.toFront();
                
            }
            pointset.attr("stroke", plot.get('color')).toFront();
            
            
        });
        
    },
    
    delegatePointEvents: function(point) {
        var self = this;
        point
            .mouseover(function(){
                self.model.set('no_render', true);
            })
            .mouseout(function(){
                self.model.set('no_render', false);
                self.model.view.render();
            })
        ;
        
    }
    
});

exports = module.exports = Viewport