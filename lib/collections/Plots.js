var Plot = require('../models/Plot');
var Plots = Backbone.Collection.extend({
    
    model: Plot,
    
    initialize: function(models, options) {
        
        this.chart = options.chart;
        this.on("add",function(model){
            model.chart = this.chart;
            model.setUp();
        });
        this.on("change",function(model){
            model.setUp();
        })
        
    }
    
});
exports = module.exports = Plots