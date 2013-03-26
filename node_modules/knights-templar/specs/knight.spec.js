describe("A template-generating knight templar", function() {
    
    var knight = require("../knights-templar");
    
    it("should compile handlebar templates by default", function() {
        var path = __dirname + "/handlebars.html";
        var template = knight.make(path);
        expect(template({ name:"test" })).toEqual('<p>test</p>');
    });
    
    it("should compile underscore templates too, with aliases", function() {
        var path = __dirname + "/underscore.html";
        var template = knight.make(path,"_");
        var template2 = knight.make(path,"underscore");
        expect(template({ name:"test" })).toEqual('<p>test</p>');
    });
    
    it("should accept common aliases for types", function() {
        var path = __dirname + "/handlebars.html";
        var data = {name: "aliases"};
        var template = knight.make(path);
        var template2 = knight.make(path,"hbs");
        var template3 = knight.make(path,"handlebars");
        var template4 = knight.make(path,"Handlebars");
        expect(template(data) === template2(data)).toBeTruthy();
        expect(template(data) === template3(data)).toBeTruthy();
        expect(template(data) === template4(data)).toBeTruthy();
    });
    
    it("should complain if a file does not exist", function() {
        var badCall = function() {
            knight.make(__dirname+'/notafile')
        }
        expect(badCall).toThrow();
    });
    
})