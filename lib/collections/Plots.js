var Plot = require('../models/Plot');
var Plots = Backbone.Collection.extend({
    
    model: Plot,
    
    initialize: function(models, options) {
        var self = this;
        this.chart = options.chart;
        this.on("add",function(model){
            model.chart = this.chart;
            model.setUp();
        });
        this.on("change",function(model){
            model.setUp();
        });
        this.chart.data.on("add",function(model){
            this.each(function(plot){
                if (plot.get('lowerY') === "auto" || plot.get('upperY') === "auto") plot.setUp();
            });
            this.trigger("update");
        },this);
        
    }
    
});
exports = module.exports = Plots