var DataPoint = require("../models/DataPoint");
var ChartData = Backbone.Collection.extend({
    
    model: DataPoint,
    
    initialize: function(models, options) {
        
    },
    
    getYExtrema: function(key) {
        var extrema = {}
        this.each(function(model) {
            var value = model.get(key);
            extrema.min = extrema.min === undefined ? value : Math.min(extrema.min, value) ;
            extrema.max = extrema.max === undefined ? value : Math.max(extrema.max, value) ;
        });
        if (extrema.min === undefined) {
            extrema.min = 0;
            extrema.max = 0;
        }
        return extrema;
    }
    
    
});

exports = module.exports = ChartData