exports.addClass = function(element, classname) {
    element.node.className ? element.node.className.baseVal = classname : element.node.setAttribute('class',  classname);
    return element;
}