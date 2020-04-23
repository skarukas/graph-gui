let defaultCanvas = document.getElementById("graph-gui") as HTMLCanvasElement;

export default function graph(canvas: HTMLCanvasElement = defaultCanvas) {
    return new Graph(canvas);
}

class Color {
    toString(): string {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
    constructor(public r: number, public g: number = r, public b: number = r, public a: number = 1) {
        this.r = this.clipTo8Bit(r);
        this.g = this.clipTo8Bit(g);
        this.b = this.clipTo8Bit(b);
        this.a = this.clipTo8Bit(a * 256) / 256;
    }
    private clipTo8Bit(n: number) {
        return Math.max(0, Math.min(255, Math.round(n)));
    }
    getDiff(other: Color): number[] {
        return [other.a - this.a, other.g - this.g, other.b - this.b, other.a - this.a];
    }
    increment(vals: number[]): void {
        this.r += vals[0];
        this.g += vals[1];
        this.b += vals[2];
        this.a += vals[3];
    }
}

interface Drawable {
    draw(context: CanvasRenderingContext2D, drawingPrefs: any): void;
}

class Circle implements Drawable {
    center: Point;
    isSelected: boolean;
    isHovered: boolean;

    constructor(x = 0, y = 0, public radius = 20) {
        this.center = new Point(x, y);
    }
    draw(context: CanvasRenderingContext2D, drawingPrefs: any) {
        let color = drawingPrefs.stdColor;
        if (this.isSelected) color = drawingPrefs.selectedColor;
        else if (this.isHovered) color = drawingPrefs.hoveredColor;

        context.beginPath();
        context.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = color.toString();
        context.fill();
        context.strokeStyle = drawingPrefs.outlineColor.toString();
        context.lineWidth = drawingPrefs.outlineWidth;
        context.stroke();
    }
    moveTo(x: number, y: number) {
        this.center.moveTo(x, y);
    }
    contains(p: Point) {
        return p.distTo(this.center) < this.radius;
    }
}

class Point {
    constructor(public x: number, public y: number) {}
    distTo(other: Point) {
        return Math.sqrt((this.x-other.x)**2 + (this.y-other.y)**2);
    }
    moveTo(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return `${this.constructor.name}(${this.x}, ${this.y})`
    }
    lineTo(other: Point) {
        return new Line(this, other);
    }
    innerAngleTo(other: Point): number {
        let angle = Math.atan((this.y - other.y) / (this.x - other.x));
        return angle;
    }
}

class Line implements Drawable {
    isHovered: boolean;
    constructor(public a: Point, public b: Point) { }
    draw(context: CanvasRenderingContext2D, drawingPrefs: any) {
        context.lineWidth = drawingPrefs.lineWidth;
        if (this.isHovered) context.strokeStyle = drawingPrefs.hoveredColor.toString();
        else context.strokeStyle = drawingPrefs.stdColor.toString();
        context.beginPath();
        context.moveTo(this.a.x, this.a.y);
        context.lineTo(this.b.x, this.b.y);
        context.stroke();
    }
    midpoint() {
        return new Point((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
    }
    length() {
        return this.a.distTo(this.b);
    }
    toString() {
        return this.a.toString() + " to " + this.b.toString();
    }
    contains(p: Point) {
        let thresh = 5;
        if (Math.abs(this.a.x - this.b.x) > 2*thresh && this.a.x < p.x == this.b.x < p.x) return false;
        if (Math.abs(this.a.y - this.b.y) > 2*thresh && this.a.y < p.y == this.b.y < p.y) return false;
        return this.distTo(p) < thresh;
    }
    distTo(p: Point) {
        let angle1 = this.a.innerAngleTo(p),
            angle2 = this.a.innerAngleTo(this.b),
            dist = Math.sin(angle2 - angle1) * this.a.distTo(p);
        return Math.abs(dist);
    }
}

class Edge<T> extends Line {
    constructor(public begin: Vertex<any>, public end: Vertex<any>, public data?: T) {
        super(begin.center, end.center);
    }
    toString() {
        console.log("called toString on", this.data)
        return this.data.toString();
    }
    drawText(context: CanvasRenderingContext2D, drawingPrefs: any) {
        if (drawingPrefs.alwaysDisplayText || this.isHovered) {
            let { x, y } = this.midpoint();

            context.textAlign = "center";
            context.font = drawingPrefs.fontSize + "px " + drawingPrefs.fontFace;
            let str = (this.data == undefined)? "" : drawingPrefs.displayString(this.data);
            let {width: textWidth } = context.measureText(str);

            if (this.length() > textWidth && str) {
                let adj = this.begin.center.x - this.end.center.x,
                opp = this.begin.center.y - this.end.center.y,
                angle = Math.atan(opp/adj);

                // rotate around the midpoint to match the angle of the line
                context.save();
                context.translate(x, y);
                context.rotate(angle);
                
                // fade color when too compressed
                this.length() == textWidth; 0
                let threshold = (this.begin.radius + this.end.radius),
                    lengthDiff = (this.length() - threshold) - textWidth,
                    alpha = Math.max(0, Math.min(1,  lengthDiff/ (2 * threshold)));

                // draw text at the midpoint (the origin of the translated system)
                context.globalAlpha = alpha;
                if (this.isHovered) context.fillStyle = drawingPrefs.hoveredColor.toString();
                else context.fillStyle = drawingPrefs.stdColor.toString();
                context.fillText(str, 0, -drawingPrefs.lineWidth);

                context.restore();
            }
        }
    }
}

class Vertex<T> extends Circle {
    constructor(x: number, y: number, data = {}) {
        super(x, y);
        this.data = data as T;
    }
    data: T;
    toString() {
        return this.data.toString();
    }
    drawText(context: CanvasRenderingContext2D, drawingPrefs: any) {
        // only draw text if hovered
        if (drawingPrefs.alwaysDisplayText || this.isSelected || this.isHovered) {
            // display string of internal data
            let str = drawingPrefs.displayString(this.data),
                metrics = context.measureText(str),
                width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight + drawingPrefs.textBoxPadding * 2,
                height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + drawingPrefs.textBoxPadding * 2;

            if (str) {
                let x = this.center.x;
                let y;

                // if the text doesn't fit in the circle, put it above
                if (Math.sqrt(width * width + height * height) < this.radius*2) {
                    y = this.center.y + (metrics.actualBoundingBoxAscent ) / 2;
                } else {
                    y = this.center.y - (this.radius + 4 + drawingPrefs.textBoxPadding);

                    let beginX = (x - metrics.actualBoundingBoxLeft) - drawingPrefs.textBoxPadding,
                        beginY = (y - metrics.actualBoundingBoxAscent) - drawingPrefs.textBoxPadding;

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
    }
}

function addHandlers(canvas: HTMLCanvasElement, model: Model<any, any>) {
    const modifiers = {
        mouseDown: false,
        ctrlDragged: false,
        ctrlPressed: false,
        shiftPressed: false,
        shiftDragged: false
    }
     
    // CANVAS EVENT LISTENERS
    canvas.onmousemove = (e: MouseEvent) => {
        if (modifiers.mouseDown) {
            if (modifiers.ctrlDragged && !modifiers.shiftDragged) model.ctrlDragTo(e.x, e.y);
            else if (modifiers.shiftDragged) model.shiftKeyAt(e.x, e.y);
            else model.dragTo(e.x, e.y);
        } else {
            model.checkHovered(e.x, e.y);
        }   
    }

    canvas.onmousedown = (e: MouseEvent) => {
        modifiers.ctrlDragged = modifiers.ctrlPressed;
        modifiers.mouseDown = true;
        modifiers.shiftDragged = modifiers.shiftPressed
        if (modifiers.shiftPressed) model.shiftKeyAt(e.x, e.y);
    }
    canvas.onmouseup = (e: MouseEvent) => {
        modifiers.ctrlDragged = false;
        modifiers.shiftDragged = false;
        modifiers.mouseDown = false;
        model.releaseDrag();
        model.checkHovered(e.x, e.y);
    }

    function isControlKey(e: KeyboardEvent) {
        return e.key == "Meta" || e.key == "Ctrl";
    }

    canvas.oncontextmenu = (e: MouseEvent) => {
        e.preventDefault();
        model.rightClick(e.x, e.y);
        modifiers.mouseDown = false;
        return false;
    }

    // WINDOW EVENT LISTENERS

    window.onkeydown = (e: KeyboardEvent) => {
        if (e.key == "Shift") {
            canvas.style.cursor = "not-allowed"
            modifiers.shiftPressed = true;
        } else if (isControlKey(e)) {
            canvas.style.cursor = "crosshair"
            modifiers.ctrlPressed = true;
        }
    }
    window.onkeyup = (e: KeyboardEvent) => {
        if (isControlKey(e)) {
            canvas.style.cursor = "auto"
            modifiers.ctrlPressed = false;
        } else if (e.key == "Shift") {
            canvas.style.cursor = "auto"
            modifiers.shiftPressed = false;
        }
    }  
    window.onresize = resizeCanvas;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        model.redraw();
    }
    resizeCanvas();
}

class Model<V, E> {
    private edges: Edge<E>[] = [];
    private vertices: Vertex<V>[] = []; 
    private target: Vertex<V>;
    private curr: Vertex<V>;
    private currEdge: Edge<E>;
    
    constructor(private view: View<V, E>, private graph: Graph<V, E>) { }

    initialize(numVertex = 10) {
        this.vertices = [], this.edges = [];

        // create some vertices in random places
        for (let i = 0; i < numVertex; i++) {
            let x = Math.random() * window.innerWidth,
                y = Math.random() * window.innerHeight;
            this.tryAddVertex(Math.floor(x), Math.floor(y));
        }

        // create some edges
        for (let i = 1; i < numVertex; i++) {
            this.tryAddEdge(this.vertices[0], this.vertices[i]);
        }
        this.redraw();
    }
    redraw() {
        this.view.redraw(this.vertices, this.edges);
    }
    // functions that edit the graph representation (no validation)
    addEdge(e: Edge<E>) {
        this.edges.push(e);
        this.redraw();
    }
    addVertex(v: Vertex<V>) {
        this.vertices.push(v);
        this.redraw();
    }
    removeEdge(index: number) {
        this.edges.splice(index, 1);
        this.redraw();
    }
    removeVertex(index: number) {
        this.removeAttachedEdges(index);
        this.vertices.splice(index, 1);
        this.redraw();
    }
    removeAttachedEdges(index: number) {
        let v = this.vertices[index];
        // remove all attached edges and notify
        this.edges = this.edges.filter((e: Edge<E>) => {
            let edgeHasVertex = e.begin === v || e.end === v;
            if (edgeHasVertex) this.graph.event.onremoveedge(e.data);
            return !edgeHasVertex;
        });
        this.redraw();
    }
    moveVertex(v: Vertex<V>, x: number, y: number) {
        v.moveTo(x, y);
        this.redraw();
    }
    editVertex(v: Vertex<V>, newData: V) {
        v.data = newData;
        this.redraw();
    }
    editEdge(e: Edge<E>, newData: E) {
        e.data = newData;
        this.redraw();
    }

    // query the representation
    getVertexAtPoint(x: number, y: number, except?: Vertex<V>) {
        let index = this.vertices.findIndex((v: Vertex<V>) => v !== except && v.contains(new Point(x, y))),
            vertex = this.vertices[index];
        return { index, vertex };
    }
    getEdgeAtPoint(x: number, y: number, except?: Edge<E>) {
        let index = this.edges.findIndex((e: Edge<E>) => e !== except && e.contains(new Point(x, y))),
            edge = this.edges[index];
            //console.log(edge)
        return { index, edge };
    }
    getVertexWithData(data: V) {
        let index = this.vertices.findIndex((v: Vertex<V>) => v.data == data),
            vertex = this.vertices[index];
        return { index, vertex };
    }
    getEdgeWithData(data: E) {
        let index = this.edges.findIndex((e: Edge<E>) => e.data == data),
            edge = this.edges[index];
        return { index, edge };
    }
    getEdgeWithVertices(fromData: V, toData: V) {
        let index = this.edges.findIndex((e: Edge<E>) => {
            return (e.begin.data == fromData && e.end.data == toData)
                || (e.begin.data == toData && e.end.data == fromData);
            }),
            edge = this.edges[index];
        return { index, edge };
    }
    edgeExists(from: Vertex<V>, to: Vertex<V>): boolean {
        for (let {begin, end} of this.edges) {
            if ((from == begin && to == end) 
               || (from == end && to == begin)) return true;
        }
        return false;
    }
    // call handlers and try to edit the representation
    tryAddVertex(x: number, y: number) {
        try {
            let handlerResult = this.graph.event.onaddvertex(x, y);
            if (handlerResult === false) throw new Error();

            // infer vertex class type from the result
            this.graph.vertexPrefs.class = this.graph.vertexPrefs.class || this.getConstructor(handlerResult);

            let v = new Vertex<V>(x, y);
            if (handlerResult !== true) v.data = (handlerResult == undefined)? v.data : handlerResult as V;
            this.addVertex(v);
            return v;
        } catch (e) {
            console.warn("Unable to add vertex.", e.message);
            return null;
        }
    }
    private getConstructor(data: any) {
        try   { return data.constructor } 
        catch { return Object }
    }
    tryAddEdge(from: Vertex<V>, to: Vertex<V>): boolean {
        try {
            // no parallel or directed edges
            if (this.edgeExists(from, to)) throw new Error("Edge already exists in graph.");

            // call handler and test result
            let handlerResult = this.graph.event.onaddedge(from.data, to.data);
            if (handlerResult === false) throw new Error();

            // infer vertex class type from the result
            this.graph.edgePrefs.class = this.graph.edgePrefs.class || this.getConstructor(handlerResult);

            // add edge, either with data or without
            let e = new Edge<E>(from, to);
            if (handlerResult !== true) e.data = (handlerResult == undefined)? e.data : handlerResult as E;
            this.addEdge(e);
            return true;
        } catch (e) {
            console.warn("Unable to add edge.", e.message);
            return false;
        }
    }
    tryEditVertex(v: Vertex<V>) {
        try {
            // prompt the user and call handler on the input
            let userInput: string = prompt(this.graph.vertexPrefs.editPrompt);
            if (!userInput) return;
            let handlerResult = this.graph.event.oneditvertex(v.data, userInput) || v.data;
            // typecheck result
            let C = this.graph.vertexPrefs.class;
            if (C && !(handlerResult instanceof C || typeof handlerResult === C.name.toLowerCase())) {
                throw new Error("The input did not produce a result of class " + C.name);
            }

            this.editVertex(v, handlerResult);
            return true;
        } catch (e) {
            console.warn("Unable to edit vertex.", e.message);
            return false;
        }
    }
    tryEditEdge(e: Edge<E>) {
        try {
            // prompt the user and call handler on the input
            let userInput: string = prompt(this.graph.edgePrefs.editPrompt);
            if (!userInput) return;
            let handlerResult = this.graph.event.oneditedge(e.data, userInput) || e.data;
            // typecheck result
            let C = this.graph.edgePrefs.class;
            if (C && !(handlerResult instanceof C || typeof handlerResult === C.name.toLowerCase())) {
                throw new Error("The input did not produce a result of class " + C.name);
            }

            this.editEdge(e, handlerResult);
            return true;
        } catch (e) {
            console.warn("Unable to edit edge.", e.message);
            return false;
        }
    }
    tryMoveVertex(v: Vertex<V>, x: number, y: number) {
        try {
            let handlerResult = this.graph.event.onmovevertex(v.data, x, y);
            if (handlerResult === false) throw new Error();
            else this.moveVertex(v, x, y);
            return true;
        } catch (e) {
            console.warn("Unable to move vertex.", e.message);
            return false;
        }
    }
    tryRemoveVertex(index: number): boolean {
        try {
            let v = this.vertices[index],
                handlerResult = this.graph.event.onremovevertex(v.data);
            if (handlerResult === false) throw new Error();
            else this.removeVertex(index);
            return true;
        } catch (e) {
            console.warn("Unable to remove vertex.", e.message);
            return false;
        }   
    }
    tryRemoveEdge(index: number): boolean {
        try {
            let e = this.edges[index],
                handlerResult = this.graph.event.onremoveedge(e.data);
            if (handlerResult === false) throw new Error();
            else this.removeEdge(index);
            return true;
        } catch (e) {
            console.warn("Unable to remove edge.", e.message);
            return false;
        }   
    }
    rightClick(x: number, y: number) {
        let { vertex } = this.getVertexAtPoint(x, y);
        if (vertex) {
            this.tryEditVertex(vertex);
            return;
        } 
        let { edge } = this.getEdgeAtPoint(x, y);
        if (edge) this.tryEditEdge(edge);
        else {
            let v = this.tryAddVertex(x, y);
            //this.tryEditVertex(v); // immediately edit?
        }
    }
    shiftKeyAt(x: number, y: number) {
        let { index } = this.getVertexAtPoint(x, y);
        if (~index) {
            this.tryRemoveVertex(index);
        } else {
            index = this.getEdgeAtPoint(x, y).index;
            if (~index) this.tryRemoveEdge(index);
        }
    }
    dragTo(x: number, y: number): void {
        if (this.curr) this.tryMoveVertex(this.curr, x, y);
    }
    ctrlDragTo(x: number, y: number) {
        if (this.curr) {
            this.redraw();
            this.view.drawLine(this.curr.center, new Point(x, y));
            this.target = this.updateHoveredVertex(this.target, x, y);
        }
    }
    releaseDrag() {
        if (this.target) {
            this.tryAddEdge(this.curr, this.target);
            this.target.isHovered = false;
            this.target = undefined;
        }
    }
    checkHovered(x: number, y: number) {
        this.curr = this.updateHoveredVertex(this.curr, x, y);
        this.currEdge = this.updateHoveredEdge(this.currEdge, x, y);
    }
    private updateHoveredEdge(curr: Edge<E>, x: number, y: number) {
        // no edge hovering when a vertex is hovered
        if (this.curr) {
            curr && (curr.isHovered = false);
            this.redraw();
            return undefined;
        }

        let prev: Edge<E> = curr;

        let { index } = this.getEdgeAtPoint(x, y);
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
    }
    private updateHoveredVertex(curr: Vertex<V>, x: number, y: number) {
        let prev: Vertex<V> = curr;

        let { index } = this.getVertexAtPoint(x, y);
        curr = this.vertices[index];

        if (curr !== prev) {
            if (curr != undefined) {
                curr.isHovered = true;
                // move to front
                this.vertices.splice(index, 1);
                this.vertices.unshift(curr);
            }
            if (prev != undefined) prev.isHovered = false;
            this.redraw();
        }
        return curr;
    }
}

interface Constructor {
    new (...args: any): any;
}

class Graph<V, E> {
    initialize() {
        this.model.initialize();
    }
    /**
     *  For use by the backend code.
     */
    readonly addEdge = (fromVertex: V, toVertex: V, edgeData?: E) => {
        let { edge } = this.model.getEdgeWithVertices(fromVertex, toVertex);
        if (!edge) {
            let { vertex: from } = this.model.getVertexWithData(fromVertex),
                { vertex: to   } = this.model.getVertexWithData(toVertex);
            this.model.addEdge(new Edge(from, to, edgeData));
        }
        return !edge;
    }
    /**
     *  For use by the backend code.
     */
    readonly addVertex = (vertexData: V, x: number = Math.random() * this.width, y: number = Math.random() * this.height) => {
        let { vertex } = this.model.getVertexWithData(vertexData);
        if (!vertex) {
            let v = new Vertex<V>(x, y);
            v.data = vertexData;
            this.model.addVertex(v);
        }
        return !vertex;
    }
    /**
     *  For use by the backend code.
     */
    readonly removeVertex = (vertexData: V) => {
        let { index } = this.model.getVertexWithData(vertexData);
        if (~index) {
            this.model.removeVertex(index);
        }
        return !!~index;
    }
    /**
     *  For use by the backend code.
     */
    readonly removeEdge = (edgeData: E) => {
        let { index } = this.model.getEdgeWithData(edgeData);
        if (~index) this.model.removeEdge(index);
        return !!~index;
    }
    readonly removeEdgeByVertices = (startVertex: V, endVertex: V) => {
        // check that edge with data is in graph
        let { index } = this.model.getEdgeWithVertices(startVertex, endVertex); 
        if (~index) this.model.removeEdge(index);
        return !!~index;
    }
    /**
     *  For use by the backend code.
     */
    readonly moveVertex = (vertexData: V, x: number, y: number) => {
        let { vertex } = this.model.getVertexWithData(vertexData);
        if (vertex) this.model.moveVertex(vertex, x, y);
        return !!vertex;
    }
    /**
     *  For use by the backend code.
     */
    readonly editVertex = (oldValue: V, newValue: V) => {
        let { vertex } = this.model.getVertexWithData(oldValue);
        if (vertex) this.model.editVertex(vertex, newValue);
        return !!vertex;
    }
    /**
     *  For use by the backend code.
     */
    readonly editEdge = (oldValue: E, newValue: E) => {
        let { edge } = this.model.getEdgeWithData(oldValue);
        if (edge) this.model.editEdge(edge, newValue);
        return !!edge;
    }
    readonly editEdgeByVertices = (startVertex: V, endVertex: V, newValue: E) => {
        let { edge } = this.model.getEdgeWithVertices(startVertex, endVertex);
        if (edge) this.model.editEdge(edge, newValue);
        return !!edge;
    }

    private model: Model<V, E>;
    constructor(readonly canvas: HTMLCanvasElement) { 
        let view = new View(this);
        this.model = new Model(view, this);
        addHandlers(this.canvas, this.model);

        this.width = canvas.width;
        this.height = canvas.height;
    }
    width: number;
    height: number;
    suppressWarnings() {
        this.event.suppressWarnings = true;
    }
    backgroundColor: Color | string = new Color(240);
    vertexPrefs = {
        class: undefined,
        displayString(obj: Object) {
            return obj.toString();
        },
        textColor: "#24B4F4" as Color | string,
        textBoxColor: new Color(256, 256, 256, 0.9) as Color | string,
        textBoxPadding: 2,
        alwaysDisplayText: false,
        fontFace: "Arial",
        fontSize: 12,
        outlineWidth: 2,
        outlineColor: new Color(0) as Color | string,
        stdColor: new Color(256) as Color | string,
        hoveredColor: new Color(230) as Color | string,
        selectedColor: new Color(160) as Color | string,
        editPrompt: "Enter a new value for this vertex."
    };
    edgePrefs = {
        class: undefined,
        lineWidth: 2,
        displayString(obj: Object) {
            return obj.toString();
        },
        stdColor: new Color(0) as Color | string,
        hoveredColor: "#24B4F4" as Color | string,
        fontFace: "Arial",
        fontSize: 12,
        alwaysDisplayText: true,
        editPrompt: "Enter a new value for this edge."
    };
    event = {
        suppressWarnings: false,
        // EVENT HANDLERS
    
        /**
         * Called by the framework whenever the user draws an edge between two vertices. 
         * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created edge. 
         * - Returning a boolean type (`false` or `true`) determines whether the graph should display the edge.
         */
        onaddedge(from: V, to: V): E | boolean | void {
            !this.suppressWarnings && console.warn("No onaddedge handler specified.");
        },
        /**
         * Called by the framework whenever the user creates a vertex.
         * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created vertex. 
         * - Returning a boolean type (`false` or `true`) determines whether the graph should display the vertex.
         */
        onaddvertex(x: number, y: number, ...args: any): V | boolean | void {
            !this.suppressWarnings && console.warn("No onaddvertex handler specified.");
        },
        /**
         * Called by the framework whenever the user removes a vertex.
         * - Generally, performs a "remove" action on the graph model.
         * - Returning a boolean type (`false` or `true`) specifies whether the vertex was successfully removed.
         */
        onremovevertex(vertexData: V) : boolean | void {
            !this.suppressWarnings && console.warn("No onremovevertex handler specified.");
        },   
        /**
         * Called by the framework whenever the user removes a edge.
         * - Generally, performs a "remove" action on the graph model.
         * - Returning a boolean type (`false` or `true`) specifies whether the edge was successfully removed.
         */
        onremoveedge(edgeData: E) : boolean | void {
            !this.suppressWarnings && console.warn("No onremoveedge handler specified.");
        },
        onmovevertex(vertexData: V, x: number, y: number) : boolean | void {
            !this.suppressWarnings && console.warn("No onmovevertex handler specified.");
        },
        oneditvertex(vertexData: V, userInput: string): V | void {
            !this.suppressWarnings && console.warn("No oneditvertex handler specified.");
        },
        oneditedge(edgeData: E, userInput: string): E | void {
            !this.suppressWarnings && console.warn("No oneditedge handler specified.");
        }
    }
}

class View<V,E> {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(private graph: Graph<V,E>) {
        this.canvas = graph.canvas;
        this.context = this.canvas.getContext("2d");
    }
    private drawBackground() {
        this.context.fillStyle = this.graph.backgroundColor.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    private drawEdges(edges: Edge<E>[]) {
        for (let e of edges) e.draw(this.context, this.graph.edgePrefs);
    }
    private drawEdgeText(edges: Edge<E>[]) {
        for (let e of edges) e.drawText(this.context, this.graph.edgePrefs);
    }
    private drawVertices(vertices: Vertex<V>[]) {
        // draw vertices in reverse
        for (let i = vertices.length-1; i >= 0; i--) {
            vertices[i].draw(this.context, this.graph.vertexPrefs);
        }
    }
    private drawVertexText(vertices: Vertex<V>[]) {
        // draw vertex text in reverse
        for (let i = vertices.length-1; i >= 0; i--) {
            vertices[i].drawText(this.context, this.graph.vertexPrefs);
        }
    }
    private drawTitle() {
        this.context.fillStyle = this.graph.vertexPrefs.textColor.toString();
        this.context.textAlign = "center";
        this.context.font = 20 + "px " + this.graph.vertexPrefs.fontFace;
        this.context.fillText("Interactive Graph", this.canvas.width/2, 40);
    
        this.context.font = 10 + "px " + this.graph.vertexPrefs.fontFace;
        this.context.fillText("© Stephen Karukas (github.com/skarukas)", this.canvas.width/2, 54);
    }
    drawLine(start: Point, end: Point) {
        start.lineTo(end).draw(this.context, this.graph.edgePrefs);
    }
    redraw(vertices: Vertex<V>[], edges: Edge<E>[]) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawEdges(edges);
        this.drawEdgeText(edges);
        this.drawVertices(vertices);
        this.drawVertexText(vertices);
        this.drawTitle();
    }
}