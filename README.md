# graph-gui
An (in progress) [interactive graph interface](https://skarukas.github.io/graph-gui/index.html) using the HTML canvas element. 

Displays data stored in edges and vertices of an undirected graph. `demo.js` displays points and their Euclidian distances, and `stringDemo.js` just allows direct editing of edge and vertex labels.

#### GUI commands:
- Dragging vertices changes their position.
- Command/Ctrl-dragging connects two vertices. 
- Holding shift deletes edges or vertices. 
- Right-clicking in an empty space creates a new vertex.
- Right-clicking over a vertex or edge edits its data.


![Screenhsot](./graph-story.png)

The framework emits events when the user adds, removes, or edits vertexes and edges and when they move vertices. These events are handled and approved by user-defined methods located in `Graph.event`.

Only tested on Mac (Safari/Chrome) at the moment. More documentation about creating custom "backends" coming soon.
