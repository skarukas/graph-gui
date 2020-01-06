// using the gui's internal classes just for the demo

class MyPoint extends Point {
    toString() {
        return `${this.constructor.name}(${this.x}, ${this.y})`
    }
}

graph.onaddedge = (from: MyPoint, to: MyPoint) => {
    let line = new Line(from, to);
    // random way of causing a problem
    if (from.x % 10 == 0) return false;
    if (from.x % 13 == 0) throw new Error("Divisible by 13!");
    else return line;
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