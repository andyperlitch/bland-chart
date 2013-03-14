var BaseView = require('./BaseView');
var Overview = require('./Overview');
var Viewport = require('./Viewport');
var Yaxes = require('./Yaxes');
var Xaxis = require('./Xaxis');
var Resizer = require('./Resizer');

var BlandChartView = BaseView.extend({

    // Re-render the entire chart when plots are added or removed,
    // and when the key to the x values has changed.
    initialize: function() {
        this.listenTo(this.model.plots, "add remove", this.render );
        this.listenTo(this.model, "change:x_axis_key change:viewport_width", this.render);
    },
    
    template: _.template('<div class="chart-yaxes"></div><div class="chart-overviewport"><div class="chart-resizer"><div class="resizer-grip"></div><div class="resizer-grip"></div><div class="resizer-grip"></div></div><div class="chart-viewport"></div><div class="chart-xaxis"></div><div class="chart-overview"></div></div>'),
    
    render: function() {
        if (this.model.get('no_render')) return;
        // Destroy all views
        this.clearViews();
        
        // Set the base html
        this.$el.html(this.template({})).css({ height: (this.model.get("overview_height") + this.model.get("viewport_height"))+"px"})
        
        // Create all necessary views (with elements)
        if (this.model.get("overview")) this.setView("overview", new Overview({ model: this.model, collection: this.model.data, el: this.$(".chart-overview")[0] }) );
        this.setView("viewport", new Viewport({ model: this.model, collection: this.model.data, el: this.$(".chart-viewport")[0] }) );
        this.setView("yaxes", new Yaxes({ model: this.model, collection: this.model.data, el: this.$(".chart-yaxes")[0] }) );
        this.setView("xaxis", new Xaxis({ model: this.model, collection: this.model.data, el: this.$(".chart-xaxis")[0] }) );
        this.setView("resizer", new Resizer({ model: this.model , el: this.$(".chart-resizer")[0] }) );
        
        // Render views
        this.renderSubs();
        
        // Allow chaining
        return this;
    }
    
});

exports = module.exports = BlandChartView