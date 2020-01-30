const g = graph();

// defining some "back-end" classes for representing points and their distances
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
        return this.a.distTo(this.b);
    }
}

// ====== USING THE GRAPH =======

g.suppressWarnings();

g.vertexPrefs.class = MyPoint;

g.edgePrefs.displayString = (line) => {
    return "distance: " + Math.floor(line.length()) + "px";
}

g.vertexPrefs.displayString = (point) => {
    return `(${point.x}, ${point.y})`;
}

g.vertexPrefs.editPrompt = "Enter a new location for the Point.\nFormat: x, y";


// =======EVENT HANDLERS==========
g.event.onaddedge = (from, to) => {
    return new MyLine(from, to);
}

// change coords within MyPoint
g.event.onmovevertex = (data, x, y) => {
    data.moveTo && data.moveTo(x, y);
}

g.event.onaddvertex = (x, y) => {
    return new MyPoint(x, y);
}

// move the vertex if the user inputs an (x, y) pair
g.event.oneditvertex = (currPt, data) => {
    let coords = data.split(",").map(s => parseInt(s));
    currPt.moveTo(coords[0] || currPt.x, coords[1] || currPt.y);
    g.moveVertex(currPt, currPt.x, currPt.y);
    return currPt;
}


// generate random vertices
g.initialize();