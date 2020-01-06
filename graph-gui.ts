let canvas = document.getElementById("graph-gui") as HTMLCanvasElement,
    ctx: CanvasRenderingContext2D = canvas.getContext("2d");

class Color {
    r: number;
    g: number; 
    b: number;
    a: number;
    toString(): string {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
    constructor(r: number, g: number = r, b: number = r, a: number = 1) {
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

class Circle {
    hovered = false;
    center: Point;
    context: CanvasRenderingContext2D = ctx; // may be changed at a future time

    constructor(x = 0, y = 0, public radius = 20) {
        this.center = new Point(x, y);
    }
    draw(color: Color | string = graph.vertexPrefs.stdColor) {
        let str = color.toString();
        this.context.beginPath();
        this.context.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        this.context.fillStyle = str;
        this.context.fill();
        this.context.strokeStyle = graph.vertexPrefs.outlineColor.toString();
        this.context.lineWidth = graph.vertexPrefs.outlineWidth;
        this.context.stroke();
    }
    moveTo(x: number, y: number) {
        this.center.moveTo(x, y);
    }
    contains(p: Point) {
        return p.distTo(this.center) < this.radius;
    }
}

class Line {
    context = ctx; // may be changed at a future time

    constructor(public a: Point, public b: Point) { }
    draw() {

        this.context.lineWidth = graph.edgePrefs.lineWidth;
        this.context.strokeStyle = graph.edgePrefs.stdColor.toString();

        this.context.beginPath();
        this.context.moveTo(this.a.x, this.a.y);
        this.context.lineTo(this.b.x, this.b.y);
        this.context.stroke();
    }
    midpoint() {
        return new Point((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
    }
    length() {
        //console.log(this.a, this.b)
        return this.a.distTo(this.b);
    }
}

class Edge extends Line { 
    constructor(public begin: Vertex, public end: Vertex, public data?: any) {
        super(begin.center, end.center);
    }
    toString() {
        return this.data.toString();
    }
    drawText() {
        let { x, y } = this.midpoint();

        this.context.textAlign = "center";
        this.context.font = graph.edgePrefs.fontSize + "px " + graph.edgePrefs.fontFace;

        let str = (this.data == undefined)? "" : graph.edgePrefs.displayString(this.data);

        let {width: textWidth } = this.context.measureText(str);

        if (this.length() > textWidth) {
            let adj = this.begin.center.x - this.end.center.x,
            opp = this.begin.center.y - this.end.center.y,
            angle = Math.atan(opp/adj);

            // rotate around the midpoint to match the angle of the line
            this.context.save();
            this.context.translate(x, y);
            this.context.rotate(angle);
            
            // fade color when too compressed
            this.length() == textWidth; 0
            let threshold = (this.begin.radius + this.end.radius),
                lengthDiff = (this.length() - threshold) - textWidth,
                alpha = Math.max(0, Math.min(1,  lengthDiff/ (2 * threshold)));

            // draw text at the midpoint (the origin of the translated system)
            this.context.globalAlpha = alpha;
            this.context.fillStyle = graph.edgePrefs.stdColor.toString();
            this.context.fillText(str, 0, -graph.edgePrefs.lineWidth);

            this.context.restore();
        }
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
}

class Vertex extends Circle {
    data: any;
    toString() {
        return this.data.toString();
    }
    drawText() {
        let x = this.center.x,
            y = this.center.y - (this.radius + 4 + graph.vertexPrefs.textBoxPadding);

        this.context.textAlign = "center";
        this.context.font = graph.vertexPrefs.fontSize + "px " + graph.vertexPrefs.fontFace;

        // display string of internal data
        let str = graph.vertexPrefs.displayString(this.data),
            metrics = this.context.measureText(str),
            beginX = (x - metrics.actualBoundingBoxLeft) - graph.vertexPrefs.textBoxPadding,
            beginY = (y - metrics.actualBoundingBoxAscent) - graph.vertexPrefs.textBoxPadding,
            width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight + graph.vertexPrefs.textBoxPadding * 2,
            height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + graph.vertexPrefs.textBoxPadding * 2;

        // draw colored rectangle
        this.context.fillStyle = graph.vertexPrefs.textBoxColor.toString();
        this.context.fillRect(beginX, beginY, width, height);
        
        // draw text
        this.context.fillStyle = graph.vertexPrefs.textColor.toString();
        this.context.fillText(str, x, y);
    }
}

const graph = {
    initialize: () => {},
    backgroundColor: new Color(240) as Color | string,
    vertexPrefs: {
        displayString: (obj: Object) => obj.toString(),
        textColor: "#24B4F4" as Color | string,
        textBoxColor: new Color(256, 256, 256, 0.9) as Color | string,
        textBoxPadding: 2,
        fontFace: "Arial",
        fontSize: 12,
        outlineWidth: 2,
        outlineColor: new Color(0) as Color | string,
        stdColor: new Color(256) as Color | string,
        hoveredColor: new Color(230) as Color | string,
        selectedColor: new Color(160) as Color | string
    },
    edgePrefs: {
        lineWidth: 2,
        displayString: (obj: Object) => obj.toString(),
        stdColor: new Color(0) as Color | string,
        hoveredColor: new Color(230) as Color | string,
        fontFace: "Arial",
        fontSize: 12
    },
    // EVENT HANDLERS
    
    /**
     * Called by the framework whenever the user draws an edge between two vertices. 
     * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created edge. 
     * - Returning a boolean type (`false` or `true`) determines whether the graph should display the edge.
     */
    onaddedge: ((...args) => {
        console.warn("No onaddedge handler specified.");
    }) as (from: any, to: any) => Object | boolean | void,
    /**
     * Called by the framework whenever the user creates a vertex.
     * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created vertex. 
     * - Returning a boolean type (`false` or `true`) determines whether the graph should display the vertex.
     */
    onaddvertex: ((...args) => {
        console.warn("No onaddvertex handler specified.");
    }) as (x: number, y: number, ...args) => Object | boolean | void,
    /**
     * Called by the framework whenever the user removes a vertex.
     * - Generally, performs a "remove" action on the graph model.
     * - Returning a boolean type (`false` or `true`) specifies whether the vertex was successfully removed.
     */
    onremovevertex: ((...args) => {
        console.warn("No onremovevertex handler specified.");
    }) as (vertexData: any) => boolean | void,   
    /**
     * Called by the framework whenever the user removes a edge.
     * - Generally, performs a "remove" action on the graph model.
     * - Returning a boolean type (`false` or `true`) specifies whether the edge was successfully removed.
     */
    onremoveedge: ((...args) => {
        console.warn("No onremoveedge handler specified.");
    }) as (edgeData: any) => boolean | void,
    onmovevertex: ((...args) => {
        console.warn("No onmovevertex handler specified.");
    }) as (vertexData: any, x: number, y: number) => boolean | void,
}

{  
    graph.initialize = initializeGraph;

    window.onresize = resizeCanvas;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }

    let vertices: Vertex[] = [],
        edges: Edge[] = [],
        curr: Vertex,
        target: Vertex,
        numVertex = 10,
        mouseDown = false,
        ctrlClicked: boolean,
        ctrlPressed: boolean;
        
    function initializeGraph() {
        vertices = [], edges = [];

        // initialize some vertices in random places
        for (let i = 0; i < numVertex; i++) {
            let x = Math.random() * window.innerWidth,
                y = Math.random() * window.innerHeight;
            addVertex(Math.floor(x), Math.floor(y));
        }

        // initialize some edges
        for (let i = 1; i < numVertex; i++) addEdge(vertices[0], vertices[i]);

        resizeCanvas();
    }
    //initializeGraph();

    function draw() {
        // fill background
        ctx.fillStyle = graph.backgroundColor.toString();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // create edges
        for (let e of edges) {
            e.draw();
            e.drawText();
        }

        // draw vertices in reverse
        for (let i = numVertex-1; i >= 0; i--) {
            let v = vertices[i];
            if (v == target) v.draw(graph.vertexPrefs.hoveredColor);
            else if (v == curr) v.draw(graph.vertexPrefs.selectedColor);
            else v.draw();
        }

        // draw vertex text in reverse
        for (let i = numVertex-1; i >= 0; i--) {
            let v = vertices[i];
            if (v == curr || v == target) vertices[i].drawText();
        }

        // draw title
        ctx.fillStyle = graph.vertexPrefs.textColor.toString();
        ctx.textAlign = "center";
        ctx.font = 20 + "px " + graph.vertexPrefs.fontFace;
        ctx.fillText("Interactive Graph", canvas.width/2, 40);

        ctx.font = 10 + "px " + graph.vertexPrefs.fontFace;
        ctx.fillText("© Stephen Karukas (github.com/skarukas)", canvas.width/2, 54);
    }

    function releaseTarget() {
        if (target) {
            addEdge(curr, target);
            target = undefined;
        }
    }

    function dragVertexTo(p: Point): void {
        if (!curr) return;
        redraw();

        if (ctrlClicked) {
            (new Line(curr.center, p)).draw();
            //drawLine(ctx, curr.center, p);
            target = getVertexAtPoint(p, curr);
        } else moveVertex(curr, p.x, p.y);
    }

    function moveVertex(v: Vertex, x: number, y: number) {
        try {
            let handlerResult = graph.onmovevertex(curr.data, x, y);
            if (handlerResult === false) throw new Error();
            else curr.moveTo(x, y);
        } catch (e) {
            console.warn("Unable to move vertex.", e.message);
        }
    }

    function addVertex(x: number, y: number) {
        try {
            let v = new Vertex(x, y);
            v.data = graph.onaddvertex(x, y);
            vertices.push(v);
        } catch (e) {
            console.warn("Unable to add vertex.", e.message);
        }
    }
    function addEdge(from: Vertex, to: Vertex) {
        try {
            // call handler and retrieve result
            let addResult = graph.onaddedge(from.data, to.data);
            let e: Edge;

            if (!edgeExists([from, to])) {
                if (addResult === false) throw new Error();
                if (addResult === true || addResult === undefined) e = new Edge(from, to);
                else e = new Edge(from, to, addResult as Object);
                edges.push(e);
            }
        } catch (e) {
            console.warn("Unable to add edge.", e.message);
        }
    }

    function edgeExists(pair: [Vertex, Vertex]): boolean {
        for (let {begin, end} of edges) {
            if ((pair[0] == begin && pair[1] == end) 
               || (pair[0] == end && pair[1] == begin)) return true;
        }
        return false;
    }

    function getVertexAtPoint(p: Point, except: Vertex = undefined): Vertex {
        return vertices.find((v: Vertex) => {
            let closeEnough = v !== except && v.contains(p);
            if (closeEnough) {

            }
            return closeEnough;
        });
    }
    
    const checkHovered = (e: MouseEvent) => {
        let p = new Point(e.x, e.y);
        if (mouseDown) {
            dragVertexTo(p);
        } else {
            let changed = false,
                prev = curr;

            let currIndex = vertices.findIndex((v: Vertex) => v.contains(p));
            curr = vertices[currIndex];
            
            if (curr) {
                // move to front
                let temp = vertices[0];
                vertices[0] = curr;
                vertices[currIndex] = temp;
                
                if (curr != prev) changed = true;
            } else if (prev) {
                changed = true;
            }

            changed && redraw();
        }

        function fadeIn(vertex: Vertex) {
            transitionColors(graph.vertexPrefs.stdColor as Color, graph.vertexPrefs.hoveredColor as Color, 500, (c: Color) => vertex.draw(c));
        }
    }

    // CANVAS EVENT LISTENERS

    canvas.onmousemove = checkHovered;

    canvas.onmousedown = (e: MouseEvent) => {
        ctrlClicked = ctrlPressed;
        mouseDown = true;
    }
    canvas.onmouseup = (e: MouseEvent) => {
        ctrlClicked = false;
        mouseDown = false;
        releaseTarget();
        checkHovered(e);
    }
    function isControlKey(e: KeyboardEvent) {
        return e.key == "Meta" || e.key == "Ctrl"
    }

    // WINDOW EVENT LISTENERS

    window.onkeydown = (e: KeyboardEvent) => {
        if (isControlKey(e)) {
            canvas.style.cursor = "crosshair"
            ctrlPressed = true;
        }
    }
    window.onkeyup = (e: KeyboardEvent) => {
        if (isControlKey(e)) {
            canvas.style.cursor = "auto"
            ctrlPressed = false;
        }
    }

    function redraw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        draw();
    }

    function transitionColors(from: Color, to: Color, ms: number, callback, fps = 29) {
        let frameCount = (ms / 1000) * fps,
            trans = true,
            incVals = from.getDiff(to).map(n => n / frameCount);
    
        setTimeout(() => trans = false, ms);
    /*     while (trans) {
            setInterval(() => {
                from.increment(incVals);
            }, 1000 / fps);
        } */
        callback(from);
    }
}