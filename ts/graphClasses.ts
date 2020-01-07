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
}

class Line implements Drawable {
    constructor(public a: Point, public b: Point) { }
    draw(context: CanvasRenderingContext2D, drawingPrefs: any) {
        context.lineWidth = drawingPrefs.lineWidth;
        context.strokeStyle = drawingPrefs.stdColor.toString();
        context.beginPath();
        context.moveTo(this.a.x, this.a.y);
        context.lineTo(this.b.x, this.b.y);
        context.stroke();
    }
    midpoint() {
        return new Point((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
    }
    length() {
        //console.log(this.a, this.b)
        return this.a.distTo(this.b);
    }
    toString() {
        return this.a.toString() + " to " + this.b.toString();
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
        let { x, y } = this.midpoint();

        context.textAlign = "center";
        context.font = drawingPrefs.fontSize + "px " + drawingPrefs.fontFace;

        let str = (this.data == undefined)? "" : drawingPrefs.displayString(this.data);

        let {width: textWidth } = context.measureText(str);

        if (this.length() > textWidth) {
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
            context.fillStyle = drawingPrefs.stdColor.toString();
            context.fillText(str, 0, -drawingPrefs.lineWidth);

            context.restore();
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
        if (this.isSelected || this.isHovered) {
            let x = this.center.x,
                y = this.center.y - (this.radius + 4 + drawingPrefs.textBoxPadding);

            context.textAlign = "center";
            context.font = drawingPrefs.fontSize + "px " + drawingPrefs.fontFace;

            // display string of internal data
            let str = drawingPrefs.displayString(this.data),
                metrics = context.measureText(str),
                beginX = (x - metrics.actualBoundingBoxLeft) - drawingPrefs.textBoxPadding,
                beginY = (y - metrics.actualBoundingBoxAscent) - drawingPrefs.textBoxPadding,
                width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight + drawingPrefs.textBoxPadding * 2,
                height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + drawingPrefs.textBoxPadding * 2;

            // draw colored rectangle
            context.fillStyle = drawingPrefs.textBoxColor.toString();
            context.fillRect(beginX, beginY, width, height);
            
            // draw text
            context.fillStyle = drawingPrefs.textColor.toString();
            context.fillText(str, x, y);
        }
    }
}

export { Vertex, Edge, Point, Color, Line, Drawable }