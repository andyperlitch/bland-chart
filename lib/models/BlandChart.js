var BlandChartView = require("../views/BlandChartView");
var Data = require("../collections/Data");
var Plots = require("../collections/Plots");
var BlandChart = Backbone.Model.extend({
    
    defaults: {
        
        // Flag indicating if the widget should be active or not.
        // See this.sleep() and this.wakeup()
        asleep: false,
        
        // Set to true if you want the viewport to follow new data
        // as it comes in
        follow: true,
        
        // The key to map x-axis values to
        x_axis_key: undefined,
        x_axis_formatter: undefined,
        
        // Indicates if the x-axis values will be ascending from left to right.
        // See this.setX for more details.
        ascending: true,
        
        // This indicates the render mode for displaying data
        mode: "line",
        
        // Maximum number of points to render in 100px space before 
        // data starts being omitted from rendering.
        max_detail: 10,
        
        // The max number of data points to be held before oldest data gets removed
        max_data: 1000,
        
        // Render an overview of the chart
        overview: true,
        
        // Dimensions of elements
        viewport_width: 500,
        viewport_height: 300,
        overview_height: 100,
        
        // Defines the minimum amount of spacing to have between marks on the axes
        min_spacing_y: 75,
        min_spacing_x: 250,
        
        // Offset/limit of the viewport, in either percentage or x-axis units
        viewport_offset: 0,
        viewport_limit: 100,
        lock_by_units: false,
        
        // Good for stopping the render process during a hover or other user event
        no_render: false
    },
    
    initialize: function() {
        
        // Holds all the keys of data that should be plotted
        this.plots = new Plots([], {
            chart: this
        });
        
        // Holds the event emitter that emits data to plot
        this.source = undefined;
        
        // Set the data collection
        this.data = new Data([],{
            chart: this
        });
        
    },
    
    // This sets the el for the main chart view.
    // Acceptable values for the parameter are a jQuery collection (first element is selected),
    // a DOM Element, or a jQuery selector string.
    to: function(param) {
        
        var el;
        
        if (param instanceof $) {
            el = param[0];
            if (el === undefined) 
                throw new Error("The jQuery group provided to the 'to' method did not contain any elements");
        }
        else if (param instanceof Element) {
            el = param;
        }
        else if (typeof param === "string" ) {
            el = $(param)[0];
            if (el === undefined) 
                throw new Error("The jQuery selector provided to the 'to' method did not return any elements");
        }
        else {
            throw new Error("Please provide the 'to' method with either a jQuery element, a DOM element, or a jQuery selector string.");
        }
        
        // Clean up any previous view
        if (this.view instanceof Backbone.View) {
            this.view.remove();
        }
        
        // Add bland class
        $(el).addClass("bland-chart");
        
        // Create main widget view
        this.view = new BlandChartView({
            el: el,
            model: this
        }).render();
        
    },
    
    // Sets the source to listen to for data. This should be an object with 
    // Backbone Events mixed in. This source should emit 'data' events with 
    // either an object or an array of objects to plot.
    setSource: function(source) {
        
        if (this.source) {
            this.stopListening(this.source);
        }
        
        this.source = source;
        this.listen();
    },
    
    listen: function() {
        if (!this.source) return;
        if (this.get("asleep")) return;
        
        this.listenTo( this.source, "data", function(data) {
            if (this.data.length >= this.get("max_data")) {
                var removeCount = 1;
                if (data instanceof Array) removeCount = data.length;
                while (removeCount > 0) {
                    this.data.shift();
                    removeCount--;
                }
            }
            
            this.data.add(data);
        })
    },
    
    ignore: function() {
        if (!this.source) return;
        this.stopListening();
    },
    
    // Sets the x-axis of the data being plotted.
    // The key parameter indicates the key to look to for x values.
    // The ascending parameter is a boolean value: true for ordering the 
    // x axis values ascending from left to right... false for vise versa
    setX: function(key, formatter, ascending) {
        
        this.set("x_axis_key", key);
        this.set("x_axis_formatter", formatter);
        if (ascending !== undefined) this.set("ascending", !! ascending  );
        
    },
    
    // Tells the chart to plot the key on the data objects.
    // The lowerY and upperY params can either be the string
    // "auto" or numeric values. 
    // The max detail option can be set to override the chart detail value
    // for this specific key. If only two arguments are present,
    // the second is assummed to be this.
    plot: function(key, color, lowerY, upperY, label, max_detail) {
        lowerY = lowerY === undefined ? "auto" : lowerY ;
        upperY = upperY === undefined ? "auto" : upperY ;
        max_detail = max_detail === undefined ? this.get('max_detail') : max_detail ;
        this.plots.add({
            key: key,
            color: color,
            lowerY: lowerY, 
            upperY: upperY,
            max_detail: max_detail,
            label: label || key
        }, {merge: true} );
    },
    
    // Removes plot key from the plots hash.
    unplot: function(key) {
        var model = this.plots.get(key);
        if (model) {
            this.plots.remove(model);
        }
    },
    
    // Completely clears the chart.
    clear: function() {
        this.data.reset([]);
    },
    
    // Stops the chart from making any actions. Useful for when the widget is 
    // not currently visible
    sleep: function() {
        this.ignore();
        this.set("asleep",true);
    },
    
    wakeup: function() {
        this.set("asleep",false);
        this.listen();
    },
    
    export: function() {
        
    },
    
    getViewportXExtrema: function() {
        // Get the full range of x values from data collection
        var extrema = this.getFullXExtrema();
        if (extrema === false) return false;
        var full_range = extrema.max - extrema.min;
        // Get the amount to go on the viewport x axis
        var percent_limit = this.get('viewport_limit');
        var x_limit = percent_limit != 0 ? (percent_limit/100)*full_range : full_range ;
        // Get starting point from offset
        var percent_offset = this.get('viewport_offset');
        var x_offset = percent_offset != 0 ? (percent_offset/100)*full_range + extrema.min : extrema.min ;
        return {
            min: x_offset,
            max: x_offset + x_limit
        }
    },
    
    getFullXExtrema: function() {
        if (this.data.length === 0) return false;
        var self = this;
        return _.reduce(this.data, function(memo, value, i, data){
            // console.log("args",arguments);
            var point = data.at(i);
            var x = point.get(self.get('x_axis_key'));
            memo.min = memo.min === undefined ? x : Math.min(memo.min, x) ;
            memo.max = memo.max === undefined ? x : Math.max(memo.max, x) ;
            return memo;
        }, {}, this);
    },
    
    toViewportX: function(real_offset) {
        var extrema = this.getViewportXExtrema();
        var real_range = extrema.max - extrema.min;
        var pixel_range = this.get('viewport_width');
        var x_ratio = pixel_range/real_range;
        var pixel_offset = (real_offset - extrema.min) * x_ratio;
        return pixel_offset;
    }
    
});

exports = module.exports = BlandChart