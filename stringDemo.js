const g = graph();

g.suppressWarnings();

// event handlers
g.event.onaddedge = (from, to) => "";

g.event.onaddvertex = (x, y) => "";

g.event.oneditvertex = (curr, data) => data;

g.initialize();