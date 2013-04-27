var Resizer = Backbone.View.extend({
    
    initialize: function(options) {
        this.rootView = options.rootView;
    },
    
    events: {
        'mousedown': 'grabResizer',
        'dblclick': 'autoSize'
    },
    
    render: function() {
        return this;
    },
    
    grabResizer: function(evt) {
        if ( evt.button === 2 ) return;
        evt.preventDefault();
        evt.originalEvent.preventDefault();
        
        var initialX = evt.clientX;
        var initialY = evt.clientY;
        var initialWidth = this.model.get('viewport_width');
        var initialHeight = this.model.get('viewport_height');
        
        var resize = function(evt) {
            evt.preventDefault();
            evt.originalEvent.preventDefault();
            var deltaX = evt.clientX - initialX;
            var deltaY = evt.clientY - initialY;
            var newWidth = +initialWidth + +deltaX;
            var newHeight = +initialHeight + +deltaY;
            this.setWidth(newWidth);
            this.setHeight(newHeight);
        }.bind(this);
        
        var release = function(evt) {
            $(window).off('mousemove', resize);
        }
        
        $(window).one('mouseup', release);
        $(window).on('mousemove', resize);
    },
    
    autoSize: function() {
        var newWidth = this.rootView.$el.width() - this.rootView.$('.chart-yaxes').width() - 10;
        this.setWidth(newWidth);
    },
    
    setWidth: function(newWidth) {
        this.model.set({'viewport_width':newWidth}, {validate: true});
        this.model.storeValue('viewport_width', this.model.get('viewport_width'));
    },
    
    setHeight: function(newHeight) {
        this.model.set({'viewport_height': newHeight}, {validate: true});
        this.model.storeValue('viewport_height', this.model.get('viewport_height'));
    }
    
});

exports = module.exports = Resizer