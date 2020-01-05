let canvas = document.getElementById("graph-gui") as HTMLCanvasElement,
    ctx: CanvasRenderingContext2D = canvas.getContext("2d");

/* //get DPI
let dpi = window.devicePixelRatio;

function fix_dpi() {
    //get CSS height
    //the + prefix casts it to an integer
    //the slice method gets rid of "px"
    let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    //get CSS width
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
    //scale the canvas
    canvas.setAttribute('height', (style_height * dpi)+"");
    canvas.setAttribute('width', (style_width * dpi)+"");
} */


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
    color = graph.vertex.stdColor; // should it really store a color?
    hovered = false;
    point: Point;
    context: CanvasRenderingContext2D;

    constructor(x = 0, y = 0, public radius = 20) {
        this.point = new Point(x, y);
    }
    draw(color: Color = graph.vertex.stdColor) {
        this.color = color;
        let str = color.toString();
        this.context.beginPath();
        this.context.arc(this.point.x, this.point.y, this.radius, 0, 2 * Math.PI);
        this.context.fillStyle = str;
        this.context.fill();
        this.context.strokeStyle = graph.vertex.outlineColor.toString();
        this.context.lineWidth = graph.vertex.outlineWidth;
        this.context.stroke();
    }
    lineTo(other: Circle) {
        let temp = this.context.strokeStyle,
            d = this.point.dist(other.point),
            c = Math.min(d/3, 200);

        this.context.lineWidth = graph.edge.lineWidth;
        this.context.strokeStyle = (new Color(c)).toString();
        drawLine(this.context, this.point, other.point);
        this.context.strokeStyle = temp;
    }
    moveTo(newPoint: Point) {
        this.point = newPoint;
    }
    contains(p: Point) {
        return p.dist(this.point) < this.radius;
    }
}

class Pair {
    constructor(public x, public y) {}
}

class Point extends Pair {
    dist(other: Point) {
        return Math.sqrt((this.x-other.x)**2 + (this.y-other.y)**2);
    }
}

class CircleWrapper extends Circle {
    data: Object = new DemoObj(13, 34);
    drawText() {
        let x = this.point.x,
            y = this.point.y - (this.radius + 4);

        this.context.textAlign = "center";
        this.context.font = graph.vertex.fontSize + "px " + graph.vertex.fontFace;

        // display constructor name and internal data (in this case, just the point)
        let str = graph.vertex.displayString(this.data),
            metrics = this.context.measureText(str),
            beginX = x - metrics.actualBoundingBoxLeft,
            beginY = (y - metrics.actualBoundingBoxAscent),
            width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
            height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        // draw transparent white rectangle
        this.context.fillStyle = graph.vertex.textBoxColor.toString();
        this.context.fillRect(beginX, beginY, width, height);
        
        // draw text
        this.context.fillStyle = graph.vertex.textColor.toString();
        this.context.fillText(str, x, y);
    }
}

class DemoObj extends Pair {
    toString() {
        return `${this.constructor.name}(${this.x}, ${this.y})`
    }
}

const graph = {
    backgroundColor: new Color(240),
    vertex: {
        displayString: (obj) => obj.toString(),
        textColor: "#24B4F4",
        textBoxColor: new Color(256, 256, 256, 0.8),
        fontFace: "Arial",
        fontSize: 12,
        outlineWidth: 2,
        outlineColor: new Color(0),
        stdColor: new Color(256),
        hoveredColor: new Color(230),
        selectedColor: new Color(160)
    },
    edge: {
        lineWidth: 3,
        displayString: undefined
    }
}

{   

    
    window.onresize = resizeCanvas;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }

    let circles = [],
        pairs = [],
        curr: Circle,
        target: Circle,
        numCircles = 10,
        mouseDown = false,
        ctrlClicked: boolean,
        ctrlPressed: boolean;
        
    function createCircles() {
        circles = []
        for (let i = 0; i < numCircles; i++) {
            let x = Math.random() * window.innerWidth,
                y = Math.random() * window.innerHeight,
                circle = new CircleWrapper(Math.floor(x), Math.floor(y));
            circle.context = ctx;
            circles.push(circle);
        }

        for (let i = 1; i < numCircles; i++) pairs.push(new Pair(circles[0], circles[i]));

        resizeCanvas();
    }
    createCircles();
    //setInterval(createCircles, 100)

    function draw() {
        // fill background
        ctx.fillStyle = graph.backgroundColor.toString();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // create lines
        for (let {x, y} of pairs) x.lineTo(y);

        // draw circles in reverse
        for (let i = numCircles-1; i >= 0; i--) {
            let c = circles[i];
            if (c == target) c.draw(graph.vertex.hoveredColor);
            else if (c == curr) {
                //console.log("darwing curr")
                c.draw(graph.vertex.selectedColor);
            }
            else c.draw();
        }

        // draw circle text in reverse
        for (let i = numCircles-1; i >= 0; i--) {
            let c = circles[i];
            if (c == curr || c == target) circles[i].drawText();
        }
    }

    function dragCircleTo(p: Point): void {
        if (!curr) return;
        redraw();

        if (ctrlClicked) {
            drawLine(ctx, curr.point, p);
            target = getCircleAtPoint(p, curr);
            target && (target.color = graph.vertex.hoveredColor);
        } else {
            curr.color = graph.vertex.selectedColor;
            curr.moveTo(p);
        }
    }
    function releaseTarget() {
        if (target) {
            //console.log("connecting",curr.toString(), target.toString());
            let p = new Pair(target, curr);
            if (!pairExists(p)) pairs.push(p);
            target = undefined;
        }
    }

    function pairExists(p: Pair) {
        for (let {x, y} of pairs) {
            let bool = (p.x == x && p.y == y) || (p.x == y && p.y == x);
            if (bool) return true;
        }
        return false;
    }

    function getCircleAtPoint(p: Point, except: Circle = undefined): Circle {
        return circles.find((circle: Circle) => circle !== except && circle.contains(p));
    }
    
    const checkHovered = (e: MouseEvent) => {
        let p = new Point(e.x, e.y);
        if (mouseDown) {
            dragCircleTo(p);
        } else {
            let changed = false,
            prev = curr;

            curr && (curr.color = graph.vertex.stdColor);
            let currIndex = circles.findIndex((circle: Circle) => circle.contains(p));
            curr = circles[currIndex];
            
            if (curr) {
                // move to front
                let temp = circles[0];
                circles[0] = curr;
                circles[currIndex] = temp;

                curr.color = graph.vertex.hoveredColor;
                
                if (curr != prev) changed = true;
            } else if (prev) {
                changed = true;
            }

            changed && redraw();
        }

        function fadeIn(circle: Circle) {
            transitionColors(graph.vertex.stdColor, graph.vertex.hoveredColor, 500, (c: Color) => circle.draw(c));
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
        //console.log(pairs);
        checkHovered(e);
    }
    function isControlKey(e: KeyboardEvent) {
        return e.key == "Meta" || e.key == "Ctrl"
    }

    // WINDOW EVENT LISTENERS

    window.onkeydown = (e: KeyboardEvent) => {
        if (isControlKey(e)) ctrlPressed = true;
    }
    window.onkeyup = (e: KeyboardEvent) => {
        if (isControlKey(e)) ctrlPressed = false;
    }

    function redraw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        draw();
    }
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

function drawLine(ctx, a: Point, b: Point) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}