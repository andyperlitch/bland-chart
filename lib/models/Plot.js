var Markers = require('../collections/Markers');
var Plot = Backbone.Model.extend({
    
    defaults: {

        // Bounds of the Y axis
        lowerY: "auto",
        upperY: "auto",
        
        // Maximum number of points to render in 100px space before 
        // data starts being omitted from rendering.
        max_detail: 5,
        
        // Color of the line
        color: "#000000",
        
        label: ""
        
    },
    
    idAttribute: "key",
    
    setUp: function() {
        
        // Create markers collection
        this.markers = new Markers([], {
            plot: this
        })
        
        // Generate markers
        // determine lower and upper bounds
        var lower = this.get('lowerY');
        var upper = this.get('upperY');
        var extrema;
        var ten_percent;
        if ( lower === "auto" ) {
            extrema = this.chart.data.getYExtrema(this.get("key"));
            // 10% on either side of the extremas
            ten_percent = (extrema.max - extrema.min)*0.1;
            if (ten_percent === 0) {
                if (extrema.max !== 0) ten_percent = Math.abs(extrema.max) * 0.1;
                else ten_percent = 1;
            }
            lower = extrema.min - ten_percent;
        }
        if ( upper === "auto" ) {
            extrema = extrema || this.chart.data.getYExtrema(this.get("key"));
            ten_percent = ten_percent || (extrema.max - extrema.min)*0.1 ;
            upper = extrema.max + ten_percent;
        }
        // Get the range
        var range = upper - lower;
        
        // Get number of markers to show
        var max_markers = Math.floor( this.chart.get("viewport_height") / this.chart.get("min_spacing_y"));
        var pixel_increments = this.chart.get("viewport_height") / max_markers;
        var value_increments = range / max_markers;
        // Create labels for the axis
        for ( var i = 0; i <= max_markers; i++ ) {
            // Create marker object
            var marker = { 
                top: "auto",
                bottom: i < max_markers ? (i * pixel_increments)+"px" : "auto", 
                label: this.createAxisLabel(i,value_increments,range),
                mark_class: ""
            }
            if (i === max_markers) {
                marker.top = "0";
                marker.mark_class = "top";
            } else if (i === 0) {
                marker.mark_class = "bottom";
            }
            this.markers.add(marker, {merge: true});
        }
        
    },
    
    createAxisLabel: function(i, increment, range) {
        
        console.log("increment",increment);
        
        return i*increment;
    },
    
    toViewportY: function(y) {
        // point = { x: [X], y: [Y] }
        var real_yrange = this.get("upperY") - this.get("lowerY");
        var pixel_yrange = this.chart.get("viewport_height");
        var y_ratio = pixel_yrange / real_yrange;
        var y_pixels = y * y_ratio ;
        // flip to adjust for downward-facing y axis
        var y1 = pixel_yrange - y_pixels ;
        
        return y1;
    },
    
    serialize: function() {
        var retval = this.toJSON();
        retval.markers = this.markers.toJSON();
        return retval;
    }
});

exports = module.exports = Plot