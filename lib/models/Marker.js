var Marker = Backbone.Model.extend({
    
    defaults: {
        // Set to "top" if the mark should be at the top of the number rather than the bottom
        mark_class: "",
        top: "auto",
        bottom: "auto",
        label: ""
    },
    
    initialize: function() {
        
    },
    
    serialize: function() {
        // var obj = {
        //     top: this.get("top"),
        //     bottom: this.get("bottom"),
        //     label: this.get("label"),
        //     mark_class: this.get("mark_class")
        // }
        return this.toJSON();
    }
    
});
exports = module.exports = Marker