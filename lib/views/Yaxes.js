var kt = require('knights-templar');
var Yaxes = Backbone.View.extend({
    
    initialize: function() {
        this.listenTo(this.model.plots, "change update", this.render);
    },
    
    render: function() {
        
        if (this.model.get('no_render')) return;
        
        this.$el.empty();
        this.model.plots.each(this.renderAxis, this);
        
        // Set height and margin-bottom
        this.$el.css( { 
            height: this.model.get("viewport_height")+"px",
            marginBottom: this.model.get("overview_height")+"px" 
        });
        
    },
    
    axis_template: kt.make(__dirname+'/../templates/Yaxis.html','_'),
    
    renderAxis: function(plot) {
        
        // Get height of y axis
        var axis_height = this.model.get("viewport_height");
        
        // Create axis element
        var markup = this.axis_template(plot.serialize());
        markup = markup.trim();
        var $axis = $(markup).appendTo(this.$el);
        
        // Determine the width the ul should be
        var axis_width = 0;
        $(".chart-yaxis-marker",$axis).each(function(i, el){
            var $marker = $(el);
            axis_width = Math.max( axis_width , $marker.width() );
        });
        $axis.find("ul").css("width", axis_width+"px");
        
        // get width of sideways text to size the axis container
        var $label = $(".yaxis-label", $axis);
        var label_width = $label.width()
        $label.css({'right':(axis_width + 10 - label_width/2 + 13)+"px"});
    }
    
});

exports = module.exports = Yaxes