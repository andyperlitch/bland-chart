var path = require('path');
var BaseView = require('bassview');
var Overview = require('./Overview');
var Viewport = require('./Viewport');
var Yaxes = require('./Yaxes');
var Xaxis = require('./Xaxis');
var kt = require('knights-templar');

var BlandChartView = BaseView.extend({

    initialize: function() {
        
        // Initialize all subviews
        this.subview( 'overview', new Overview({ model: this.model, collection: this.model.data }));
        this.subview( 'viewport', new Viewport({ model: this.model, collection: this.model.data, rootView: this }));
        this.subview( 'yaxes',    new Yaxes({ model: this.model, collection: this.model.data }));
        this.subview( 'xaxis',    new Xaxis({ model: this.model, collection: this.model.data }));
        
        // Re-render the entire chart when plots are added or removed,
        // and when the key to the x values has changed.
        this.listenTo(this.model.plots, 'add remove', this.render );
        this.listenTo(this.model, 'change:x_axis_key change:viewport_width', this.render);
    },
    
    template: kt.make(__dirname+'/../templates/BlandChartView.html','_'),
    
    render: function() {
        if (this.model.get('no_render')) return;
        
        // calculate correct height
        var height = this.$('.chart-overviewport').height() + 50;
        
        // Set the base html
        this.$el.html(this.template({})).css('height', height + 'px');
        
        // Create all necessary views (with elements)
        if (this.model.get("overview")) this.assign('.chart-overview', 'overview');
        this.assign({
            '.chart-viewport': 'viewport',
            '.chart-yaxes': 'yaxes',
            '.chart-xaxis': 'xaxis'
        });
        
        // Allow chaining
        return this;
    }
    
});

exports = module.exports = BlandChartView