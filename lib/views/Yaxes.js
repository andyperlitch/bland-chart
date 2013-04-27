var kt = require('knights-templar');
var BaseView = require('bassview');
var Yaxis = BaseView.extend({
    
    className: 'chart-yaxis',
    
    initialize: function(options) {
        
        this.chart = options.chart;
        this.listenTo(this.chart, 'change:viewport_height', this.render);
        
    },
    
    template: kt.make(__dirname+'/../templates/Yaxis.html','_'),
    
    render: function() {
        
        var plot = this.model;
        
        // Get height of y axis
        var axis_height = this.chart.get('viewport_height');
        
        // Create axis element
        var markup = this.template(plot.serialize());
        markup = markup.trim();
        var $axis = $(markup);
        
        // Determine the width the ul should be
        var axis_width = 0;
        $('.chart-yaxis-marker',$axis).each(function(i, el){
            var $marker = $(el);
            axis_width = Math.max( axis_width , $marker.width() );
        });
        $axis.find('ul').css('width', axis_width+'px');
        
        // get width of sideways text to size the axis container
        var $label = $('.yaxis-label', $axis);
        var label_width = $label.width()
        $label.css({'right':(axis_width + 10 - label_width/2 + 13)+'px'});
        
        this.$el.html($axis);
        return this;
    }
    
});
var Yaxes = BaseView.extend({
    
    initialize: function() {
        
        this.setupSubviews();
        
        this.listenTo(this.model.plots, 'add remove', function(){
            this.setupSubviews();
            this.render();
        })
        
    },
    
    setupSubviews: function() {
        // Clean up prior views, if there
        this.trigger('clean_up');
        
        // Create a subview for every plot
        this.model.plots.each(function(plot){
            
            var sv_name = plot.get('key')+'-plot';
            
            this.subview( sv_name, new Yaxis({
                model: plot,
                chart: this.model
            }));
            
        }, this);
        
    },
    
    render: function() {
        // Should it render?
        if (this.model.get('no_render')) return;
        
        // Set up hash for assign call
        var assignees = {};
        var html = '';
        this.model.plots.each(function(plot){
            
            var sv_name = plot.get('key')+'-plot';
            
            html += '<div class="'+sv_name+' chart-yaxis"></div>';
            
            assignees['.'+sv_name] = sv_name;
            
        }, this);
        
        this.$el.html(html);
        this.assign(assignees);
        
        // Set height
        this.$el.css( { 
            height: this.model.get('viewport_height')+'px'
        });
        return this;
    }
    
});

exports = module.exports = Yaxes