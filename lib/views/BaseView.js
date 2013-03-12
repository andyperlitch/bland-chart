var BaseView = Backbone.View.extend({
    
    // Sets a view to the views hash
    setView: function(key, view) {
        
        if (!(view instanceof Backbone.View)) throw new Error ("setView must be passed a Backbone View");
        
        this.views = this.views || {};
        
        // Destroy any previous view
        if ( this.views[key] instanceof Backbone.View ) this.destroyView(key);
        
        this.views[key] = view;
        
    },
    
    insertView: function(key, view, selector) {
        
        this.views = this.views || {};
        
        // Check if view is also a new one
        if ( view ) this.setView(key, view);
        
        if ( ! this.views.hasOwnProperty(key) ) return;
        
        // Add to a provided element or simply append to this.$el
        if ( selector ) this.$(selector).html( this.views[key].render().el );
        else this.$el.append( this.views[key].render().el );
        
    },
    
    renderSubs: function() {
        for(var k in this.views) {
            this.views[k].render();
        }
    },
    
    // Complete destroy a view
    destroyView: function(key) {
        
        if ( !this.views.hasOwnProperty(key) ) return;
        var view = this.views[key];
        view.undelegateEvents();
        view.$el.removeData().unbind(); 
        view.remove();  
        Backbone.View.prototype.remove.call(view);
        delete this.views[key];
        
    },
    
    clearViews: function() {
        for (var k in this.views) {
            this.destroyView(k);
        }
    }
    
});

exports = module.exports = BaseView