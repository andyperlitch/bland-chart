var Xaxis = Backbone.View.extend({
    
    initialize: function() {
        this.listenTo(this.model.data, "add", this.render );
    },
    
    render: function() {
        
        if (this.model.get('no_render')) return;
        
        this.$el.empty();
        
        // Get the extrema for the x axis
        var extrema = this.model.getViewportXExtrema();
        if (extrema === false) {
            // TODO: render in a way to show that we are waiting for data.
            return;
        }
        
        // Create the axis
        var $axis = $('<ul></ul>');
        
        // Get the range
        var range = extrema.max - extrema.min;
        
        // Get number of markers to show
        var max_markers = Math.floor( this.model.get("viewport_width") / this.model.get("min_spacing_x"));
        var pixel_increments = this.model.get("viewport_width") / max_markers;
        var value_increments = range / max_markers;

        // Create labels for the axis
        for ( var i = 0; i <= max_markers; i++ ) {
            var value = Math.round(extrema.min + i*value_increments);
            var formatter = this.model.get('x_axis_formatter');
            var display_value = ("function" === typeof formatter) ? formatter(value) : value ;
            
            var $marker = $('<li class="mark">'+display_value+'</li>')
            
            if (i === max_markers) {
                $marker.css("right", "0px").addClass('right')
            } else {
                if (i === 0) {
                    $marker.addClass('bottom');
                }
                var newLeft = i * pixel_increments;
                $marker.css('left', newLeft+"px");
            }
            $marker.appendTo($axis)
        }
        
        // Set height and append to the element
        $axis.appendTo(this.$el);
    }
    
});
exports = module.exports = Xaxis