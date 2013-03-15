var DataPoint = Backbone.Model.extend({

    idAttribute: "__id" // To ensure that data points with the same "id" field do not override each other
    
});

exports = module.exports = DataPoint