// using the gui's internal classes just for the demo
const g = graph();
console.log("running!");

class MyPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    distTo(other) {
        return Math.sqrt((this.x-other.x)**2 + (this.y-other.y)**2);
    }
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return `${this.constructor.name}(${this.x}, ${this.y})`
    }
    lineTo(other) {
        return new MyLine(this, other);
    }
}

class MyLine {
    constructor(a, b) { 
        this.a = a;
        this.b = b;
    }
    length() {
        //console.log(this.a, this.b)
        return this.a.distTo(this.b);
    }
    toString() {
        return this.a.toString() + " to " + this.b.toString();
    }
}

g.vertexPrefs.class = MyPoint;

g.edgePrefs.displayString = (l) => {
    return "distance: " + Math.floor(l.length()) + "px";
}

// event handlers
g.event.onaddedge = (from, to) => {
    return new MyLine(from, to);
}

g.event.onmovevertex = (data, x, y) => {
    data.moveTo && data.moveTo(x, y);
}

g.event.onaddvertex = (x, y) => {
    return new MyPoint(x, y);
}

g.event.oneditvertex = (curr, data) => {
    let coords = data.split(",").map(s => parseInt(s));
    curr.moveTo(coords[0] || curr.x, coords[1] || curr.y);
    g.moveVertex(curr, curr.x, curr.y);
    return curr;
}
g.initialize();

g.addVertex(new MyPoint(100, 100), 100, 100);

let p = new MyPoint(300, 300);
g.addVertex(p, 300, 300);

setTimeout(() => {
    console.log("reoving",p)
    g.removeVertex(p);
}, 10000);
