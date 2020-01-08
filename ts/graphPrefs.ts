import { Color, Edge, Vertex } from "./graphClasses";
import View from "./graphView";
import addHandlers from "./graphHandlers";
import Model from "./graphModel";

interface Constructor {
    new (...args: any): any;
}

class Graph<V, E> {
    initialize() {
        this.model.initialize();
    }
    /**
     *  For use by the backend code.
     */
    readonly addEdge = (fromVertex: V, toVertex: V, edgeData?: E) => {
        let { edge } = this.model.getEdgeWithVertices(fromVertex, toVertex);
        if (!edge) {
            let { vertex: from } = this.model.getVertexWithData(fromVertex),
                { vertex: to   } = this.model.getVertexWithData(toVertex);
            this.model.addEdge(new Edge(from, to, edgeData));
        }
        return !edge;
    }
    /**
     *  For use by the backend code.
     */
    readonly addVertex = (vertexData: V, x: number = Math.random() * this.width, y: number = Math.random() * this.height) => {
        let { vertex } = this.model.getVertexWithData(vertexData);
        if (!vertex) {
            let v = new Vertex<V>(x, y);
            v.data = vertexData;
            this.model.addVertex(v);
        }
        return !vertex;
    }
    /**
     *  For use by the backend code.
     */
    readonly removeVertex = (vertexData: V) => {
        let { index } = this.model.getVertexWithData(vertexData);
        if (~index) {
            this.model.removeVertex(index);
        }
        return !!~index;
    }
    /**
     *  For use by the backend code.
     */
    readonly removeEdge = (edgeData: E) => {
        let { index } = this.model.getEdgeWithData(edgeData);
        if (~index) this.model.removeEdge(index);
        return !!~index;
    }
    readonly removeEdgeByVertices = (startVertex: V, endVertex: V) => {
        // check that edge with data is in graph
        let { index } = this.model.getEdgeWithVertices(startVertex, endVertex); 
        if (~index) this.model.removeEdge(index);
        return !!~index;
    }
    /**
     *  For use by the backend code.
     */
    readonly moveVertex = (vertexData: V, x: number, y: number) => {
        let { vertex } = this.model.getVertexWithData(vertexData);
        if (vertex) this.model.moveVertex(vertex, x, y);
        return !!vertex;
    }
    /**
     *  For use by the backend code.
     */
    readonly editVertex = (oldValue: V, newValue: V) => {
        let { vertex } = this.model.getVertexWithData(oldValue);
        if (vertex) this.model.editVertex(vertex, newValue);
        return !!vertex;
    }
    /**
     *  For use by the backend code.
     */
    readonly editEdge = (oldValue: E, newValue: E) => {
        let { edge } = this.model.getEdgeWithData(oldValue);
        if (edge) this.model.editEdge(edge, newValue);
        return !!edge;
    }
    readonly editEdgeByVertices = (startVertex: V, endVertex: V, newValue: E) => {
        let { edge } = this.model.getEdgeWithVertices(startVertex, endVertex);
        if (edge) this.model.editEdge(edge, newValue);
        return !!edge;
    }

    private model: Model<V, E>;
    constructor(readonly canvas: HTMLCanvasElement) { 
        let view = new View(this);
        this.model = new Model(view, this);
        addHandlers(this.canvas, this.model);

        this.width = canvas.width;
        this.height = canvas.height;
    }
    width: number;
    height: number;
    suppressWarnings() {
        this.event.suppressWarnings = true;
    }
    backgroundColor: Color | string = new Color(240);
    vertexPrefs = {
        class: undefined as Constructor,
        displayString(obj: Object) {
            return obj.toString();
        },
        textColor: "#24B4F4" as Color | string,
        textBoxColor: new Color(256, 256, 256, 0.9) as Color | string,
        textBoxPadding: 2,
        fontFace: "Arial",
        fontSize: 12,
        outlineWidth: 2,
        outlineColor: new Color(0) as Color | string,
        stdColor: new Color(256) as Color | string,
        hoveredColor: new Color(230) as Color | string,
        selectedColor: new Color(160) as Color | string,
        editPrompt: "Enter a new value for this vertex."
    };
    edgePrefs = {
        lineWidth: 2,
        displayString(obj: Object) {
            return obj.toString();
        },
        stdColor: new Color(0) as Color | string,
        hoveredColor: new Color(230) as Color | string,
        fontFace: "Arial",
        fontSize: 12
    };
    event = {
        suppressWarnings: false,
        // EVENT HANDLERS
    
        /**
         * Called by the framework whenever the user draws an edge between two vertices. 
         * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created edge. 
         * - Returning a boolean type (`false` or `true`) determines whether the graph should display the edge.
         */
        onaddedge(from: V, to: V): E | boolean | void {
            !this.suppressWarnings && console.warn("No onaddedge handler specified.");
        },
        /**
         * Called by the framework whenever the user creates a vertex.
         * - Generally, performs an "add" action on the graph model and returns the data (if any) to be stored in the newly created vertex. 
         * - Returning a boolean type (`false` or `true`) determines whether the graph should display the vertex.
         */
        onaddvertex(x: number, y: number, ...args: any): V | boolean | void {
            !this.suppressWarnings && console.warn("No onaddvertex handler specified.");
        },
        /**
         * Called by the framework whenever the user removes a vertex.
         * - Generally, performs a "remove" action on the graph model.
         * - Returning a boolean type (`false` or `true`) specifies whether the vertex was successfully removed.
         */
        onremovevertex(vertexData: V) : boolean | void {
            !this.suppressWarnings && console.warn("No onremovevertex handler specified.");
        },   
        /**
         * Called by the framework whenever the user removes a edge.
         * - Generally, performs a "remove" action on the graph model.
         * - Returning a boolean type (`false` or `true`) specifies whether the edge was successfully removed.
         */
        onremoveedge(edgeData: E) : boolean | void {
            !this.suppressWarnings && console.warn("No onremoveedge handler specified.");
        },
        onmovevertex(vertexData: V, x: number, y: number) : boolean | void {
            !this.suppressWarnings && console.warn("No onmovevertex handler specified.");
        },
        oneditvertex(vertexData: V, userInput: string): V | void {
            !this.suppressWarnings && console.warn("No oneditvertex handler specified.");
        },
        oneditedge(edgeData: E, userInput: string): E | void {
            !this.suppressWarnings && console.warn("No oneditedge handler specified.");
        }
    }
}

export default Graph;