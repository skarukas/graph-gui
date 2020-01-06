// using the gui's internal classes just for the demo

class MyPoint extends Point {
    toString() {
        return `${this.constructor.name}(${this.x}, ${this.y})`
    }
}

graph.onaddedge = (from: MyPoint, to: MyPoint) => {
    return new Line(from, to);
}

graph.edgePrefs.displayString = (l: Line) => {
    return "distance: " + Math.floor(l.length()) + "px";
}
graph.onmovevertex = (data: MyPoint, x: number, y: number) => {
    data.moveTo(x, y);
}
graph.onaddvertex = (x, y) => {
    return new MyPoint(x, y);
}

graph.initialize();