var Markers = require('../collections/Markers');
// A Plot is an object that represents a logical grouping of data, i.e.
// data from the same key on incoming json objects. It is used to set the 
// y-axis scale, and convert data values to pixel y-values on the canvas.
var Plot = Backbone.Model.extend({
    
    
    defaults: {

        // Bounds of the Y axis. A string of "auto" means that the 
        // Y axis for this plot should scale with the data
        lowerY: "auto",
        upperY: "auto",
        
        // Maximum number of points to render in 100px space before 
        // data starts being omitted from rendering.
        max_detail: 5,
        
        // Color of the line/bar/etc that will be drawn.
        color: "#000000",
        
        // The label for the plot (will be displayed
        // on the y-axis and on pointinfo boxes)
        label: ""
        
    },
    
    idAttribute: "key",
    
    initialize: function() {
        this.actualLower = this.get("lowerY");
        this.actualUpper = this.get("upperY");
    },
    
    listenToDataChange: function(data) {
        var self = this;
        this.listenTo(data, "add", function() {
            if (self.get('lowerY') === "auto" || self.get('upperY') === "auto") self.setUp();
            else self.trigger("update");
        });
    },
    
    setUp: function() {
        
        // Stores the markers for the y-axis of this plot. 
        this.markers = new Markers([], {
            plot: this
        })
        
        // The markers are generated based on the size of the viewport and the upper
        // and lower bounds of plot y-axis. This will need to be dynamically computed
        // if the values of lowerY and upperY are set to "auto" and not static numbers.
        var lower = this.get('lowerY');
        var upper = this.get('upperY');
        // Object that holds the minimum and maximum values from the dataset
        var extrema;
        var ten_percent;
        if ( lower === "auto" ) {
            extrema = this.chart.data.getYExtrema(this.get("key"));
            // debugger; 
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
        
        // Set the actual bounds
        this.actualLower = lower;
        this.actualUpper = upper;
        
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
                label: this.createAxisLabel(i,value_increments, lower, range),
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
        this.trigger("update");
    },
    
    createAxisLabel: function(i, increment, lower, range) {
        
        // TODO: smarter algorithm for rounding labels to their significant digits
        var next = i*increment+lower;
        
        if (increment < 1) return Math.round(next*10)/10;
        else if (increment > 1000000000) return (Math.round(next/10000000)/100)+"B";
        else if (increment > 1000000) return (Math.round(next/10000)/100)+"M";
        else if (increment > 100) return (Math.round(next/100)/10)+"K";
        return Math.round(i*increment);
    },
    
    toViewportY: function(y) {
        // point = { x: [X], y: [Y] }
        // debugger;
        var real_yrange = this.actualUpper - this.actualLower;
        var pixel_yrange = this.chart.get("viewport_height");
        var y_ratio = pixel_yrange / real_yrange;
        var y_pixels = (y-this.actualLower) * y_ratio ;
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