import graph from "./graph.js";
const g = graph();

g.suppressWarnings();

// event handlers
g.event.onaddedge = (from, to) => "";
g.event.onaddvertex = (x, y) => "";

g.event.oneditvertex = (curr, data) => data;
g.event.oneditedge = (curr, data) => data;

g.vertexPrefs.alwaysDisplayText = true;
g.vertexPrefs.textColor = 'black'


// initialize the graph
g.addVertex("A", 100, 100);
g.addVertex("B", 300, 100);
g.addVertex("C", 300, 400);
g.addVertex("D", 500, 400);
g.addVertex("E", 500, 300);

g.addEdge("A", "B", 10);
g.addEdge("C", "B", 20);
g.addEdge("A", "C", 40);
g.addEdge("C", "D", 35);
g.addEdge("E", "B", 15);
g.addEdge("E", "D", 5);