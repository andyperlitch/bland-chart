var Resizer = Backbone.View.extend({
    
    events: {
        "mousedown": "grabResizer"
    },
    
    render: function() {
        return this;
    },
    
    grabResizer: function(evt) {
        evt.preventDefault();
        evt.originalEvent.preventDefault();
        
        var self = this;
        var initialX = evt.clientX;
        var initialWidth = this.model.get("viewport_width");
        
        function resize(evt) {
            evt.preventDefault();
            evt.originalEvent.preventDefault();
            var delta = evt.clientX - initialX;
            var newWidth = initialWidth + delta;
            self.model.set({"viewport_width":newWidth});
        }
        
        function release(evt) {
            $(window).off("mousemove", resize);
        }
        
        $(window).one("mouseup", release);
        $(window).on("mousemove", resize);
    }
    
});

exports = module.exports = Resizer