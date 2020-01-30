# graph-gui
An (in progress) [interactive graph interface](https://skarukas.github.io/graph-gui/index.html) using the HTML canvas element. 

Displays data stored in edges and vertices of an undirected graph. `demo.js` displays points and their Euclidian distances, and `stringDemo.js` just allows direct editing of edge and vertex labels.

#### GUI commands:
- Dragging vertices changes their position.
- Command/Ctrl-dragging connects two vertices. 
- Holding shift deletes edges or vertices. 
- Right-clicking in an empty space creates a new vertex.
- Right-clicking over a vertex or edge edits its data.

The framework emits events when the user attempts to add, remove, or edit vertices and edges, and when they move vertices. These events are handled and approved by programmer-defined methods located in `Graph.event`. More documentation about creating custom handlers coming soon.


![Screenshot](./graph-story.png)

Only tested on Mac (Safari/Chrome) at the moment.
