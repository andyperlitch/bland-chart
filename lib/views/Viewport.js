var kt = require('knights-templar');
var BaseView = require('bassview');
var util = require('../util');
var PathPoint = require('./PathPoint');
var Resizer = require('./Resizer');
// The focused viewing area of the chart: 
//    +------------------------------+
//    |                              | 
//    |                              | 
//    |          Viewport            | 
//    |                              | 
//    |                              | 
//    |                              | 
//    +------------------------------+
//    | \__/---\/-\_____/---\/-\/--- |
//    +------------------------------+ 
// 
var Viewport = BaseView.extend({
    
    // Re-renders whenever the charting mode is changed and when the plots object gets updated.
    initialize: function(options) {
        this.subview( 'resizer',  new Resizer({ model: this.model, rootView: options.rootView }));
        this.listenTo(this.model, "change:mode",this.render);
        this.listenTo(this.model.plots, "update", this.render);
    },
    
    template: ['<div class="canvas-trg"></div>',
        '<div class="chart-resizer">',
            '<div class="resizer-grip"></div>',
            '<div class="resizer-grip"></div>',
            '<div class="resizer-grip"></div>',
        '</div>'].join(""),
    
    render: function() {
        if (this.model.get('no_render') ) return;

        // Get dimensions
        var height = this.model.get("viewport_height");
        var width = this.model.get("viewport_width");
        
        // Create svg canvas, removing any previous
        if ( this.canvas && typeof this.canvas.remove === "function" ) {
            this.canvas.remove();
            delete this.canvas;
        }
        
        // Set up markup
        this.$el.html(this.template);
        
        // Create new canvas
        this.canvas = Raphael(
            this.$el.css({width: width+"px", height: height+"px"}).find('.canvas-trg')[0], 
            width, 
            height
        );
        
        // Assign the resizer
        this.assign({
            '.chart-resizer': 'resizer'
        });
        
        // These are the guides of the chart
        this.drawGrid(this.model.plots);
        
        // The actual data representation (lines, bars, etc)
        this.drawData(this.collection);
        
        // Set width of el
        this.$el.css('width', width+'px');
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
            var rtext = this.canvas.text(this.model.get("viewport_width")/2,10,"Waiting for Data...");
            util.addClass(rtext, "waiting-text");
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
                this.drawLineGraph(plotPoints, x_axis_key, this.canvas);
            break;
        }
    },
    
    drawLineGraph: function(plotPoints, x_axis_key, canvas) {
        // this._drawLineGraph(plotPoints, x_axis_key, canvas);
        // Cache x-coordinate conversion function
        var toX = this.model.toViewportX;
        
        // For each piece of data, there has to be an invisible rectangle 
        // that acts as the interactive (helper) surface. For these we need to create
        // a set.
        var helpers = canvas.set();
        
        // We also need to aggregate info about the individual plots,
        // which we will store here.
        var plot_info = {}
        
        for (var i=0; i < plotPoints.length; i++) {
            var point = plotPoints[i];
            var x_coord = toX.call( this.model,  point.get(x_axis_key) );
            // Start the rect half way between the previous point 
            // and the current point (by averaging the x values)
            var x_start = i === 0 
                ? 0 
                : ( toX.call( this.model,plotPoints[i-1].get(x_axis_key) ) + x_coord ) / 2;
            // End halfway between current and next point
            var x_end = i === (plotPoints.length - 1) 
                ? this.model.get('viewport_width') 
                : (toX.call( this.model,  plotPoints[i+1].get(x_axis_key) ) + x_coord ) / 2;
            // Create the helper object and delegate events
            var helper = canvas.rect(x_start, 0, x_end - x_start, this.model.get('viewport_height') );
            util.addClass( helper, "plot-helper");
            helpers.push( helper );
            
            // Add to each plot set
            this.model.plots.each(function(plot){
                var key = plot.get("key");
                // Check that it has been initialized
                if (plot_info[key] === undefined) {
                    plot_info[key] = { 
                        path: ["M"], 
                        points: canvas.set(),
                        color:plot.get('color')
                    }
                }
                // Get the y coordinate
                var y_coord = plot.toViewportY(point.get(key));
                // Append to the path
                plot_info[key].path.push(x_coord+","+y_coord,"L");
                // Create the point element
                var pathpoint = canvas.circle(x_coord, y_coord, 5);
                util.addClass(pathpoint, "plotpoint").removeData();
                // Add to the set
                plot_info[key].points.push( pathpoint );
                // delegate events
                this.delegatePointEvents.call(this, pathpoint, point, x_axis_key, key, plot);
            }, this);
            
        };
        
        for(var y_key in plot_info) {
            var info = plot_info[y_key];
            var path = info.path;
            var color = info.color;
            var points = info.points;
            
            if (plotPoints.length > 1) {
                var line = canvas.path(path.join(""));
                util.addClass(line, "plotline")
                line.removeData();
                var line_ds = window.line_ds = line.clone();
                util.addClass(line_ds, "plotline_ds").transform("T1,1");
                line.attr("stroke", color);
                line.toFront();
                
            }
            points.attr("stroke", color).toFront();
        }
    },
    
    pointInfoTpl: kt.make(__dirname+'/../templates/pointinfo.html','_'),
    
    delegatePointEvents: function(point, model, x_axis_key, y_axis_key, plot) {
        var $popup = [];
        point
            .mouseover(function(evt){
                this.model.unscheduleFunction("point_mouseout");
                point.animate({"r":10},300, "elastic");
                this.model.set('no_render', true);
                var template = this.pointInfoTpl;
                var x_formatter = this.model.get('x_axis_formatter');
                var json = {
                    label: plot.get("label"),
                    x_key: x_axis_key,
                    x_value: typeof x_formatter === "function" ? x_formatter(model.get(x_axis_key)) : model.get(x_axis_key) ,
                    y_key: y_axis_key,
                    y_value: model.get(y_axis_key),
                    top: evt.clientY - this.$el.offset().top + 10 + window.scrollY,
                    right: this.model.get('viewport_width') - (evt.clientX - this.$el.offset().left) - 50 + + window.scrollX,
                    color: plot.get("color")
                }
                var markup = template(json);
                $popup = $(markup.trim()).appendTo(this.$el);
            }.bind(this))
            .mouseout(function(){
                if ($popup.length) $popup.empty().remove();
                point.animate({"r":5},300, "elastic");
                
                this.model.scheduleFunction("point_mouseout",function(){
                    this.model.set('no_render', false);
                    this.model.view.render();
                }.bind(this), 1000);
                
            }.bind(this))
        ;
        
    }
});

exports = module.exports = Viewport