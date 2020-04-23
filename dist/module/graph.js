var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var defaultCanvas = document.getElementById("graph-gui");
export default function graph(canvas) {
    if (canvas === void 0) { canvas = defaultCanvas; }
    return new Graph(canvas);
}
var Color = /** @class */ (function () {
    function Color(r, g, b, a) {
        if (g === void 0) { g = r; }
        if (b === void 0) { b = r; }
        if (a === void 0) { a = 1; }
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.r = this.clipTo8Bit(r);
        this.g = this.clipTo8Bit(g);
        this.b = this.clipTo8Bit(b);
        this.a = this.clipTo8Bit(a * 256) / 256;
    }
    Color.prototype.toString = function () {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    };
    Color.prototype.clipTo8Bit = function (n) {
        return Math.max(0, Math.min(255, Math.round(n)));
    };
    Color.prototype.getDiff = function (other) {
        return [other.a - this.a, other.g - this.g, other.b - this.b, other.a - this.a];
    };
    Color.prototype.increment = function (vals) {
        this.r += vals[0];
        this.g += vals[1];
        this.b += vals[2];
        this.a += vals[3];
    };
    return Color;
}());
var Circle = /** @class */ (function () {
    function Circle(x, y, radius) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (radius === void 0) { radius = 20; }
        this.radius = radius;
        this.center = new Point(x, y);
    }
    Circle.prototype.draw = function (context, drawingPrefs) {
        var color = drawingPrefs.stdColor;
        if (this.isSelected)
            color = drawingPrefs.selectedColor;
        else if (this.isHovered)
            color = drawingPrefs.hoveredColor;
        context.beginPath();
        context.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = color.toString();
        context.fill();
        context.strokeStyle = drawingPrefs.outlineColor.toString();
        context.lineWidth = drawingPrefs.outlineWidth;
        context.stroke();
    };
    Circle.prototype.moveTo = function (x, y) {
        this.center.moveTo(x, y);
    };
    Circle.prototype.contains = function (p) {
        return p.distTo(this.center) < this.radius;
    };
    return Circle;
}());
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.distTo = function (other) {
        return Math.sqrt(Math.pow((this.x - other.x), 2) + Math.pow((this.y - other.y), 2));
    };
    Point.prototype.moveTo = function (x, y) {
        this.x = x;
        this.y = y;
    };
    Point.prototype.toString = function () {
        return this.constructor.name + "(" + this.x + ", " + this.y + ")";
    };
    Point.prototype.lineTo = function (other) {
        return new Line(this, other);
    };
    Point.prototype.innerAngleTo = function (other) {
        var angle = Math.atan((this.y - other.y) / (this.x - other.x));
        return angle;
    };
    return Point;
}());
var Line = /** @class */ (function () {
    function Line(a, b) {
        this.a = a;
        this.b = b;
    }
    Line.prototype.draw = function (context, drawingPrefs) {
        context.lineWidth = drawingPrefs.lineWidth;
        if (this.isHovered)
            context.strokeStyle = drawingPrefs.hoveredColor.toString();
        else
            context.strokeStyle = drawingPrefs.stdColor.toString();
        context.beginPath();
        context.moveTo(this.a.x, this.a.y);
        context.lineTo(this.b.x, this.b.y);
        context.stroke();
    };
    Line.prototype.midpoint = function () {
        return new Point((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
    };
    Line.prototype.length = function () {
        return this.a.distTo(this.b);
    };
    Line.prototype.toString = function () {
        return this.a.toString() + " to " + this.b.toString();
    };
    Line.prototype.contains = function (p) {
        var thresh = 5;
        if (Math.abs(this.a.x - this.b.x) > 2 * thresh && this.a.x < p.x == this.b.x < p.x)
            return false;
        if (Math.abs(this.a.y - this.b.y) > 2 * thresh && this.a.y < p.y == this.b.y < p.y)
            return false;
        return this.distTo(p) < thresh;
    };
    Line.prototype.distTo = function (p) {
        var angle1 = this.a.innerAngleTo(p), angle2 = this.a.innerAngleTo(this.b), dist = Math.sin(angle2 - angle1) * this.a.distTo(p);
        return Math.abs(dist);
    };
    return Line;
}());
var Edge = /** @class */ (function (_super) {
    __extends(Edge, _super);
    function Edge(begin, end, data) {
        var _this = _super.call(this, begin.center, end.center) || this;
        _this.begin = begin;
        _this.end = end;
        _this.data = data;
        return _this;
    }
    Edge.prototype.toString = function () {
        console.log("called toString on", this.data);
        return this.data.toString();
    };
    Edge.prototype.drawText = function (context, drawingPrefs) {
        if (drawingPrefs.alwaysDisplayText || this.isHovered) {
            var _a = this.midpoint(), x = _a.x, y = _a.y;
            context.textAlign = "center";
            context.font = drawingPrefs.fontSize + "px " + drawingPrefs.fontFace;
            var str = (this.data == undefined) ? "" : drawingPrefs.displayString(this.data);
            var textWidth = context.measureText(str).width;
            if (this.length() > textWidth && str) {
                var adj = this.begin.center.x - this.end.center.x, opp = this.begin.center.y - this.end.center.y, angle = Math.atan(opp / adj);
                // rotate around the midpoint to match the angle of the line
                context.save();
                context.translate(x, y);
                context.rotate(angle);
                // fade color when too compressed
                this.length() == textWidth;
                0;
                var threshold = (this.begin.radius + this.end.radius), lengthDiff = (this.length() - threshold) - textWidth, alpha = Math.max(0, Math.min(1, lengthDiff / (2 * threshold)));
                // draw text at the midpoint (the origin of the translated system)
                context.globalAlpha = alpha;
                if (this.isHovered)
                    context.fillStyle = drawingPrefs.hoveredColor.toString();
                else
                    context.fillStyle = drawingPrefs.stdColor.toString();
                context.fillText(str, 0, -drawingPrefs.lineWidth);
                context.restore();
            }
        }
    };
    return Edge;
}(Line));
var Vertex = /** @class */ (function (_super) {
    __extends(Vertex, _super);
    function Vertex(x, y, data) {
        if (data === void 0) { data = {}; }
        var _this = _super.call(this, x, y) || this;
        _this.data = data;
        return _this;
    }
    Vertex.prototype.toString = function () {
        return this.data.toString();
    };
    Vertex.prototype.drawText = function (context, drawingPrefs) {
        // only draw text if hovered
        if (drawingPrefs.alwaysDisplayText || this.isSelected || this.isHovered) {
            // display string of internal data
            var str = drawingPrefs.displayString(this.data), metrics = context.measureText(str), width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight + drawingPrefs.textBoxPadding * 2, height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + drawingPrefs.textBoxPadding * 2;
            if (str) {
                var x = this.center.x;
                var y = void 0;
                // if the text doesn't fit in the circle, put it above
                if (Math.sqrt(width * width + height * height) < this.radius * 2) {
                    y = this.center.y + (metrics.actualBoundingBoxAscent) / 2;
                }
                else {
                    y = this.center.y - (this.radius + 4 + drawingPrefs.textBoxPadding);
                    var beginX = (x - metrics.actualBoundingBoxLeft) - drawingPrefs.textBoxPadding, beginY = (y - metrics.actualBoundingBoxAscent) - drawingPrefs.textBoxPadding;
                    // draw colored rectangle
                    context.fillStyle = drawingPrefs.textBoxColor.toString();
                    context.fillRect(beginX, beginY, width, height);
                }
                context.textAlign = "center";
                context.font = drawingPrefs.fontSize + "px " + drawingPrefs.fontFace;
                // draw text
                context.fillStyle = drawingPrefs.textColor.toString();
                context.fillText(str, x, y);
            }
        }
    };
    return Vertex;
}(Circle));
function addHandlers(canvas, model) {
    var modifiers = {
        mouseDown: false,
        ctrlDragged: false,
        ctrlPressed: false,
        shiftPressed: false,
        shiftDragged: false
    };
    // CANVAS EVENT LISTENERS
    canvas.onmousemove = function (e) {
        if (modifiers.mouseDown) {
            if (modifiers.ctrlDragged && !modifiers.shiftDragged)
                model.ctrlDragTo(e.x, e.y);
            else if (modifiers.shiftDragged)
                model.shiftKeyAt(e.x, e.y);
            else
                model.dragTo(e.x, e.y);
        }
        else {
            model.checkHovered(e.x, e.y);
        }
    };
    canvas.onmousedown = function (e) {
        modifiers.ctrlDragged = modifiers.ctrlPressed;
        modifiers.mouseDown = true;
        modifiers.shiftDragged = modifiers.shiftPressed;
        if (modifiers.shiftPressed)
            model.shiftKeyAt(e.x, e.y);
    };
    canvas.onmouseup = function (e) {
        modifiers.ctrlDragged = false;
        modifiers.shiftDragged = false;
        modifiers.mouseDown = false;
        model.releaseDrag();
        model.checkHovered(e.x, e.y);
    };
    function isControlKey(e) {
        return e.key == "Meta" || e.key == "Ctrl";
    }
    canvas.oncontextmenu = function (e) {
        e.preventDefault();
        model.rightClick(e.x, e.y);
        modifiers.mouseDown = false;
        return false;
    };
    // WINDOW EVENT LISTENERS
    window.onkeydown = function (e) {
        if (e.key == "Shift") {
            canvas.style.cursor = "not-allowed";
            modifiers.shiftPressed = true;
        }
        else if (isControlKey(e)) {
            canvas.style.cursor = "crosshair";
            modifiers.ctrlPressed = true;
        }
    };
    window.onkeyup = function (e) {
        if (isControlKey(e)) {
            canvas.style.cursor = "auto";
            modifiers.ctrlPressed = false;
        }
        else if (e.key == "Shift") {
            canvas.style.cursor = "auto";
            modifiers.shiftPressed = false;
        }
    };
    window.onresize = resizeCanvas;
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        model.redraw();
    }
    resizeCanvas();
}
var Model = /** @class */ (function () {
    function Model(view, graph) {
        this.view = view;
        this.graph = graph;
        this.edges = [];
        this.vertices = [];
    }
    Model.prototype.initialize = function (numVertex) {
        if (numVertex === void 0) { numVertex = 10; }
        this.vertices = [], this.edges = [];
        // create some vertices in random places
        for (var i = 0; i < numVertex; i++) {
            var x = Math.random() * window.innerWidth, y = Math.random() * window.innerHeight;
            this.tryAddVertex(Math.floor(x), Math.floor(y));
        }
        // create some edges
        for (var i = 1; i < numVertex; i++) {
            this.tryAddEdge(this.vertices[0], this.vertices[i]);
        }
        this.redraw();
    };
    Model.prototype.redraw = function () {
        this.view.redraw(this.vertices, this.edges);
    };
    // functions that edit the graph representation (no validation)
    Model.prototype.addEdge = function (e) {
        this.edges.push(e);
        this.redraw();
    };
    Model.prototype.addVertex = function (v) {
        this.vertices.push(v);
        this.redraw();
    };
    Model.prototype.removeEdge = function (index) {
        this.edges.splice(index, 1);
        this.redraw();
    };
    Model.prototype.removeVertex = function (index) {
        this.removeAttachedEdges(index);
        this.vertices.splice(index, 1);
        this.redraw();
    };
    Model.prototype.removeAttachedEdges = function (index) {
        var _this = this;
        var v = this.vertices[index];
        // remove all attached edges and notify
        this.edges = this.edges.filter(function (e) {
            var edgeHasVertex = e.begin === v || e.end === v;
            if (edgeHasVertex)
                _this.graph.event.onremoveedge(e.data);
            return !edgeHasVertex;
        });
        this.redraw();
    };
    Model.prototype.moveVertex = function (v, x, y) {
        v.moveTo(x, y);
        this.redraw();
    };
    Model.prototype.editVertex = function (v, newData) {
        v.data = newData;
        this.redraw();
    };
    Model.prototype.editEdge = function (e, newData) {
        e.data = newData;
        this.redraw();
    };
    // query the representation
    Model.prototype.getVertexAtPoint = function (x, y, except) {
        var index = this.vertices.findIndex(function (v) { return v !== except && v.contains(new Point(x, y)); }), vertex = this.vertices[index];
        return { index: index, vertex: vertex };
    };
    Model.prototype.getEdgeAtPoint = function (x, y, except) {
        var index = this.edges.findIndex(function (e) { return e !== except && e.contains(new Point(x, y)); }), edge = this.edges[index];
        //console.log(edge)
        return { index: index, edge: edge };
    };
    Model.prototype.getVertexWithData = function (data) {
        var index = this.vertices.findIndex(function (v) { return v.data == data; }), vertex = this.vertices[index];
        return { index: index, vertex: vertex };
    };
    Model.prototype.getEdgeWithData = function (data) {
        var index = this.edges.findIndex(function (e) { return e.data == data; }), edge = this.edges[index];
        return { index: index, edge: edge };
    };
    Model.prototype.getEdgeWithVertices = function (fromData, toData) {
        var index = this.edges.findIndex(function (e) {
            return (e.begin.data == fromData && e.end.data == toData)
                || (e.begin.data == toData && e.end.data == fromData);
        }), edge = this.edges[index];
        return { index: index, edge: edge };
    };
    Model.prototype.edgeExists = function (from, to) {
        for (var _i = 0, _a = this.edges; _i < _a.length; _i++) {
            var _b = _a[_i], begin = _b.begin, end = _b.end;
            if ((from == begin && to == end)
                || (from == end && to == begin))
                return true;
        }
        return false;
    };
    // call handlers and try to edit the representation
    Model.prototype.tryAddVertex = function (x, y) {
        try {
            var handlerResult = this.graph.event.onaddvertex(x, y);
            if (handlerResult === false)
                throw new Error();
            // infer vertex class type from the result
            this.graph.vertexPrefs["class"] = this.graph.vertexPrefs["class"] || this.getConstructor(handlerResult);
            var v = new Vertex(x, y);
            if (handlerResult !== true)
                v.data = (handlerResult == undefined) ? v.data : handlerResult;
            this.addVertex(v);
            return v;
        }
        catch (e) {
            console.warn("Unable to add vertex.", e.message);
            return null;
        }
    };
    Model.prototype.getConstructor = function (data) {
        try {
            return data.constructor;
        }
        catch (_a) {
            return Object;
        }
    };
    Model.prototype.tryAddEdge = function (from, to) {
        try {
            // no parallel or directed edges
            if (this.edgeExists(from, to))
                throw new Error("Edge already exists in graph.");
            // call handler and test result
            var handlerResult = this.graph.event.onaddedge(from.data, to.data);
            if (handlerResult === false)
                throw new Error();
            // infer vertex class type from the result
            this.graph.edgePrefs["class"] = this.graph.edgePrefs["class"] || this.getConstructor(handlerResult);
            // add edge, either with data or without
            var e = new Edge(from, to);
            if (handlerResult !== true)
                e.data = (handlerResult == undefined) ? e.data : handlerResult;
            this.addEdge(e);
            return true;
        }
        catch (e) {
            console.warn("Unable to add edge.", e.message);
            return false;
        }
    };
    Model.prototype.tryEditVertex = function (v) {
        try {
            // prompt the user and call handler on the input
            var userInput = prompt(this.graph.vertexPrefs.editPrompt);
            if (!userInput)
                return;
            var handlerResult = this.graph.event.oneditvertex(v.data, userInput) || v.data;
            // typecheck result
            var C = this.graph.vertexPrefs["class"];
            if (C && !(handlerResult instanceof C || typeof handlerResult === C.name.toLowerCase())) {
                throw new Error("The input did not produce a result of class " + C.name);
            }
            this.editVertex(v, handlerResult);
            return true;
        }
        catch (e) {
            console.warn("Unable to edit vertex.", e.message);
            return false;
        }
    };
    Model.prototype.tryEditEdge = function (e) {
        try {
            // prompt the user and call handler on the input
            var userInput = prompt(this.graph.edgePrefs.editPrompt);
            if (!userInput)
                return;
            var handlerResult = this.graph.event.oneditedge(e.data, userInput) || e.data;
            // typecheck result
            var C = this.graph.edgePrefs["class"];
            if (C && !(handlerResult instanceof C || typeof handlerResult === C.name.toLowerCase())) {
                throw new Error("The input did not produce a result of class " + C.name);
            }
            this.editEdge(e, handlerResult);
            return true;
        }
        catch (e) {
            console.warn("Unable to edit edge.", e.message);
            return false;
        }
    };
    Model.prototype.tryMoveVertex = function (v, x, y) {
        try {
            var handlerResult = this.graph.event.onmovevertex(v.data, x, y);
            if (handlerResult === false)
                throw new Error();
            else
                this.moveVertex(v, x, y);
            return true;
        }
        catch (e) {
            console.warn("Unable to move vertex.", e.message);
            return false;
        }
    };
    Model.prototype.tryRemoveVertex = function (index) {
        try {
            var v = this.vertices[index], handlerResult = this.graph.event.onremovevertex(v.data);
            if (handlerResult === false)
                throw new Error();
            else
                this.removeVertex(index);
            return true;
        }
        catch (e) {
            console.warn("Unable to remove vertex.", e.message);
            return false;
        }
    };
    Model.prototype.tryRemoveEdge = function (index) {
        try {
            var e = this.edges[index], handlerResult = this.graph.event.onremoveedge(e.data);
            if (handlerResult === false)
                throw new Error();
            else
                this.removeEdge(index);
            return true;
        }
        catch (e) {
            console.warn("Unable to remove edge.", e.message);
            return false;
        }
    };
    Model.prototype.rightClick = function (x, y) {
        var vertex = this.getVertexAtPoint(x, y).vertex;
        if (vertex) {
            this.tryEditVertex(vertex);
            return;
        }
        var edge = this.getEdgeAtPoint(x, y).edge;
        if (edge)
            this.tryEditEdge(edge);
        else {
            var v = this.tryAddVertex(x, y);
            //this.tryEditVertex(v); // immediately edit?
        }
    };
    Model.prototype.shiftKeyAt = function (x, y) {
        var index = this.getVertexAtPoint(x, y).index;
        if (~index) {
            this.tryRemoveVertex(index);
        }
        else {
            index = this.getEdgeAtPoint(x, y).index;
            if (~index)
                this.tryRemoveEdge(index);
        }
    };
    Model.prototype.dragTo = function (x, y) {
        if (this.curr)
            this.tryMoveVertex(this.curr, x, y);
    };
    Model.prototype.ctrlDragTo = function (x, y) {
        if (this.curr) {
            this.redraw();
            this.view.drawLine(this.curr.center, new Point(x, y));
            this.target = this.updateHoveredVertex(this.target, x, y);
        }
    };
    Model.prototype.releaseDrag = function () {
        if (this.target) {
            this.tryAddEdge(this.curr, this.target);
            this.target.isHovered = false;
            this.target = undefined;
        }
    };
    Model.prototype.checkHovered = function (x, y) {
        this.curr = this.updateHoveredVertex(this.curr, x, y);
        this.currEdge = this.updateHoveredEdge(this.currEdge, x, y);
    };
    Model.prototype.updateHoveredEdge = function (curr, x, y) {
        // no edge hovering when a vertex is hovered
        if (this.curr) {
            curr && (curr.isHovered = false);
            this.redraw();
            return undefined;
        }
        var prev = curr;
        var index = this.getEdgeAtPoint(x, y).index;
        curr = this.edges[index];
        if (curr !== prev) {
            if (curr != undefined) {
                curr.isHovered = true;
                // move to front
                this.edges.splice(index, 1);
                this.edges.unshift(curr);
            }
            if (prev != undefined) {
                prev.isHovered = false;
            }
            this.redraw();
        }
        return curr;
    };
    Model.prototype.updateHoveredVertex = function (curr, x, y) {
        var prev = curr;
        var index = this.getVertexAtPoint(x, y).index;
        curr = this.vertices[index];
        if (curr !== prev) {
            if (curr != undefined) {
                curr.isHovered = true;
                // move to front
                this.vertices.splice(index, 1);
                this.vertices.unshift(curr);
            }
            if (prev != undefined)
                prev.isHovered = false;
            this.redraw();
        }
        return curr;
    };
    return Model;
}());
var Graph = /** @class */ (function () {
    function Graph(canvas) {
        var _this = this;
        this.canvas = canvas;
        /**
         *  For use by the backend code.
         */
        this.addEdge = function (fromVertex, toVertex, edgeData) {
            var edge = _this.model.getEdgeWithVertices(fromVertex, toVertex).edge;
            if (!edge) {
                var from = _this.model.getVertexWithData(fromVertex).vertex, to = _this.model.getVertexWithData(toVertex).vertex;
                _this.model.addEdge(new Edge(from, to, edgeData));
            }
            return !edge;
        };
        /**
         *  For use by the backend code.
         */
        this.addVertex = function (vertexData, x, y) {
            if (x === void 0) { x = Math.random() * _this.width; }
            if (y === void 0) { y = Math.random() * _this.height; }
            var vertex = _this.model.getVertexWithData(vertexData).vertex;
            if (!vertex) {
                var v = new Vertex(x, y);
                v.data = vertexData;
                _this.model.addVertex(v);
            }
            return !vertex;
        };
        /**
         *  For use by the backend code.
         */
        this.removeVertex = function (vertexData) {
            var index = _this.model.getVertexWithData(vertexData).index;
            if (~index) {
                _this.model.removeVertex(index);
            }
            return !!~index;
        };
        /**
         *  For use by the backend code.
         */
        this.removeEdge = function (edgeData) {
            var index = _this.model.getEdgeWithData(edgeData).index;
            if (~index)
                _this.model.removeEdge(index);
            return !!~index;
        };
        this.removeEdgeByVertices = function (startVertex, endVertex) {
            // check that edge with data is in graph
            var index = _this.model.getEdgeWithVertices(startVertex, endVertex).index;
            if (~index)
                _this.model.removeEdge(index);
            return !!~index;
        };
        /**
         *  For use by the backend code.
         */
        this.moveVertex = function (vertexData, x, y) {
            var vertex = _this.model.getVertexWithData(vertexData).vertex;
            if (vertex)
                _this.model.moveVertex(vertex, x, y);
            return !!vertex;
        };
        /**
         *  For use by the backend code.
         */
        this.editVertex = function (oldValue, newValue) {
            var vertex = _this.model.getVertexWithData(oldValue).vertex;
            if (vertex)
                _this.model.editVertex(vertex, newValue);
            return !!vertex;
        };
        /**
         *  For use by the backend code.
         */
        this.editEdge = function (oldValue, newValue) {
            var edge = _this.model.getEdgeWithData(oldValue).edge;
            if (edge)
                _this.model.editEdge(edge, newValue);
            return !!edge;
        };
        this.editEdgeByVertices = function (startVertex, endVertex, newValue) {
            var edge = _this.model.getEdgeWithVertices(startVertex, endVertex).edge;
            if (edge)
                _this.model.editEdge(edge, newValue);
            return !!edge;
        };
        this.backgroundColor = new Color(240);
        this.vertexPrefs = {
            "class": undefined,
            displayString: function (obj) {
                return obj.toString();
            },
            textColor: "#24B4F4",
            textBoxColor: new Color(256, 256, 256, 0.9),
            textBoxPadding: 2,
            alwaysDisplayText: false,
            fontFace: "Arial",
            fontSize: 12,
            outlineWidth: 2,
            outlineColor: new Color(0),
            stdColor: new Color(256),
            hoveredColor: new Color(230),
            selectedColor: new Color(160),
            editPrompt: "Enter a new value for this vertex."
        };
        this.edgePrefs = {
            "class": undefined,
            lineWidth: 2,
            displayString: function (obj) {
                return obj.toString();
            },
            stdColor: new Color(0),
            hoveredColor: "#24B4F4",
            fontFace: "Arial",
            fontSize: 12,
            alwaysDisplayText: true,
            editPrompt: "Enter a new value for this edge."
        };
        this.event = {
            suppressWarnings: false,
            // EVENT HANDLERS
            /**
             * Called by the framework whenever the user draws an edge between two vertices.
             * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created edge.
             * - Returning a boolean type (`false` or `true`) determines whether the graph should display the edge.
             */
            onaddedge: function (from, to) {
                !this.suppressWarnings && console.warn("No onaddedge handler specified.");
            },
            /**
             * Called by the framework whenever the user creates a vertex.
             * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created vertex.
             * - Returning a boolean type (`false` or `true`) determines whether the graph should display the vertex.
             */
            onaddvertex: function (x, y) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
                !this.suppressWarnings && console.warn("No onaddvertex handler specified.");
            },
            /**
             * Called by the framework whenever the user removes a vertex.
             * - Generally, performs a "remove" action on the graph model.
             * - Returning a boolean type (`false` or `true`) specifies whether the vertex was successfully removed.
             */
            onremovevertex: function (vertexData) {
                !this.suppressWarnings && console.warn("No onremovevertex handler specified.");
            },
            /**
             * Called by the framework whenever the user removes a edge.
             * - Generally, performs a "remove" action on the graph model.
             * - Returning a boolean type (`false` or `true`) specifies whether the edge was successfully removed.
             */
            onremoveedge: function (edgeData) {
                !this.suppressWarnings && console.warn("No onremoveedge handler specified.");
            },
            onmovevertex: function (vertexData, x, y) {
                !this.suppressWarnings && console.warn("No onmovevertex handler specified.");
            },
            oneditvertex: function (vertexData, userInput) {
                !this.suppressWarnings && console.warn("No oneditvertex handler specified.");
            },
            oneditedge: function (edgeData, userInput) {
                !this.suppressWarnings && console.warn("No oneditedge handler specified.");
            }
        };
        var view = new View(this);
        this.model = new Model(view, this);
        addHandlers(this.canvas, this.model);
        this.width = canvas.width;
        this.height = canvas.height;
    }
    Graph.prototype.initialize = function () {
        this.model.initialize();
    };
    Graph.prototype.suppressWarnings = function () {
        this.event.suppressWarnings = true;
    };
    return Graph;
}());
var View = /** @class */ (function () {
    function View(graph) {
        this.graph = graph;
        this.canvas = graph.canvas;
        this.context = this.canvas.getContext("2d");
    }
    View.prototype.drawBackground = function () {
        this.context.fillStyle = this.graph.backgroundColor.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    View.prototype.drawEdges = function (edges) {
        for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
            var e = edges_1[_i];
            e.draw(this.context, this.graph.edgePrefs);
        }
    };
    View.prototype.drawEdgeText = function (edges) {
        for (var _i = 0, edges_2 = edges; _i < edges_2.length; _i++) {
            var e = edges_2[_i];
            e.drawText(this.context, this.graph.edgePrefs);
        }
    };
    View.prototype.drawVertices = function (vertices) {
        // draw vertices in reverse
        for (var i = vertices.length - 1; i >= 0; i--) {
            vertices[i].draw(this.context, this.graph.vertexPrefs);
        }
    };
    View.prototype.drawVertexText = function (vertices) {
        // draw vertex text in reverse
        for (var i = vertices.length - 1; i >= 0; i--) {
            vertices[i].drawText(this.context, this.graph.vertexPrefs);
        }
    };
    View.prototype.drawTitle = function () {
        this.context.fillStyle = this.graph.vertexPrefs.textColor.toString();
        this.context.textAlign = "center";
        this.context.font = 20 + "px " + this.graph.vertexPrefs.fontFace;
        this.context.fillText("Interactive Graph", this.canvas.width / 2, 40);
        this.context.font = 10 + "px " + this.graph.vertexPrefs.fontFace;
        this.context.fillText("© Stephen Karukas (github.com/skarukas)", this.canvas.width / 2, 54);
    };
    View.prototype.drawLine = function (start, end) {
        start.lineTo(end).draw(this.context, this.graph.edgePrefs);
    };
    View.prototype.redraw = function (vertices, edges) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawEdges(edges);
        this.drawEdgeText(edges);
        this.drawVertices(vertices);
        this.drawVertexText(vertices);
        this.drawTitle();
    };
    return View;
}());
