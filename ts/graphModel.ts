import { Vertex, Point, Edge } from "./graphClasses";
import Graph from "./graphPrefs";
import View from "./graphView";

class Model<V, E> {
    private edges: Edge<E>[] = [];
    private vertices: Vertex<V>[] = []; 
    private target: Vertex<V>;
    private curr: Vertex<V>;
    
    constructor(private view: View<V, E>, private graph: Graph<V, E>) { }

    initialize(numVertex = 10) {
        this.vertices = [], this.edges = [];

        // create some vertices in random places
        for (let i = 0; i < numVertex; i++) {
            let x = Math.random() * window.innerWidth,
                y = Math.random() * window.innerHeight;
            this.tryAddVertex(Math.floor(x), Math.floor(y));
        }

        // create some edges
        for (let i = 1; i < numVertex; i++) {
            this.tryAddEdge(this.vertices[0], this.vertices[i]);
        }
        this.redraw();
    }
    redraw() {
        this.view.redraw(this.vertices, this.edges);
    }
    // functions that edit the graph representation (no validation)
    addEdge(e: Edge<E>) {
        this.edges.push(e);
        this.redraw();
    }
    addVertex(v: Vertex<V>) {
        this.vertices.push(v);
        this.redraw();
    }
    removeEdge(index: number) {
        this.edges.splice(index, 1);
        this.redraw();
    }
    removeVertex(index: number) {
        this.removeAttachedEdges(index);
        this.vertices.splice(index, 1);
        this.redraw();
    }
    removeAttachedEdges(index: number) {
        let v = this.vertices[index];
        // remove all attached edges and notify
        this.edges = this.edges.filter((e: Edge<E>) => {
            let edgeHasVertex = e.begin === v || e.end === v;
            if (edgeHasVertex) this.graph.event.onremoveedge(e.data);
            return !edgeHasVertex;
        });
        this.redraw();
    }
    moveVertex(v: Vertex<V>, x: number, y: number) {
        v.moveTo(x, y);
        this.redraw();
    }
    editVertex(v: Vertex<V>, newData: V) {
        v.data = newData;
        this.redraw();
    }
    editEdge(e: Edge<E>, newData: E) {
        e.data = newData;
        this.redraw();
    }

    // query the representation
    getVertexAtPoint(x: number, y: number, except?: Vertex<V>) {
        let index = this.vertices.findIndex((v: Vertex<V>) => v !== except && v.contains(new Point(x, y))),
            vertex = this.vertices[index];
        return { index, vertex };
    }
    getVertexWithData(data: V) {
        let index = this.vertices.findIndex((v: Vertex<V>) => v.data == data),
            vertex = this.vertices[index];
        return { index, vertex };
    }
    getEdgeWithData(data: E) {
        let index = this.edges.findIndex((e: Edge<E>) => e.data == data),
            edge = this.edges[index];
        return { index, edge };
    }
    getEdgeWithVertices(fromData: V, toData: V) {
        let index = this.edges.findIndex((e: Edge<E>) => {
            return (e.begin.data == fromData && e.end.data == toData)
                || (e.begin.data == toData && e.end.data == fromData);
            }),
            edge = this.edges[index];
        return { index, edge };
    }
    edgeExists(from: Vertex<V>, to: Vertex<V>): boolean {
        for (let {begin, end} of this.edges) {
            if ((from == begin && to == end) 
               || (from == end && to == begin)) return true;
        }
        return false;
    }
    // call handlers and try to edit the representation
    tryAddVertex(x: number, y: number) {
        try {
            let handlerResult = this.graph.event.onaddvertex(x, y);
            if (handlerResult === false) throw new Error();

            // infer vertex class type from the result
            this.graph.vertexPrefs.class = this.graph.vertexPrefs.class || getConstructor(handlerResult);
            let v = new Vertex<V>(x, y);
            if (handlerResult !== true) v.data = handlerResult || v.data;

            this.addVertex(v);
            return v;
        } catch (e) {
            console.warn("Unable to add vertex.", e.message);
            return null;
        }

        function getConstructor(data: any) {
            try   { return data.constructor } 
            catch { return Object }
        }
    }
    tryAddEdge(from: Vertex<V>, to: Vertex<V>): boolean {
        try {
            // no parallel or directed edges
            if (this.edgeExists(from, to)) throw new Error("Edge already exists in graph.");

            // call handler and test result
            let handlerResult = this.graph.event.onaddedge(from.data, to.data);
            if (handlerResult === false) throw new Error();

            // add edge, either with data or without
            let e = new Edge<E>(from, to);
            if (handlerResult !== true) e.data = handlerResult || e.data;

            this.addEdge(e);
            return true;
        } catch (e) {
            console.warn("Unable to add edge.", e.message);
            return false;
        }
    }
    tryEditVertex(v: Vertex<V>) {
        try {
            // prompt the user and call handler on the input
            let userInput: string = prompt(this.graph.vertexPrefs.editPrompt);
            if (!userInput) return;
            let handlerResult = this.graph.event.oneditvertex(v.data, userInput) || v.data;
            console.log(handlerResult);
            // typecheck result
            if (! (handlerResult instanceof this.graph.vertexPrefs.class)) {
                throw new Error("The input did not produce a result of class " + this.graph.vertexPrefs.class.name);
            }

            this.editVertex(v, handlerResult);
            return true;
        } catch (e) {
            console.warn("Unable to edit vertex.", e.message);
            return false;
        }
    }
    tryMoveVertex(v: Vertex<V>, x: number, y: number) {
        try {
            let handlerResult = this.graph.event.onmovevertex(v.data, x, y);
            if (handlerResult === false) throw new Error();
            else this.moveVertex(v, x, y);
            return true;
        } catch (e) {
            console.warn("Unable to move vertex.", e.message);
            return false;
        }
    }
    tryRemoveVertex(index: number): boolean {
        try {
            let v = this.vertices[index],
                handlerResult = this.graph.event.onremovevertex(v.data);
            if (handlerResult === false) throw new Error();
            else this.removeVertex(index);
            return true;
        } catch (e) {
            console.warn("Unable to remove vertex.", e.message);
            return false;
        }   
    }
    rightClick(x: number, y: number) {
        let { vertex } = this.getVertexAtPoint(x, y);
        if (vertex) this.tryEditVertex(vertex);
        else {
            let v = this.tryAddVertex(x, y);
            //this.tryEditVertex(v); // immediately edit?
        }
    }
    shiftKeyAt(x: number, y: number) {
        let { index } = this.getVertexAtPoint(x, y);
        if (~index) this.tryRemoveVertex(index);
    }
    dragTo(x: number, y: number): void {
        if (this.curr) this.tryMoveVertex(this.curr, x, y);
    }
    ctrlDragTo(x: number, y: number) {
        if (this.curr) {
            this.redraw();
            this.view.drawLine(this.curr.center, new Point(x, y));
            this.target = this.updateHoveredVertex(this.target, x, y);
        }
    }
    releaseDrag() {
        if (this.target) {
            console.log("releasing target");
            this.tryAddEdge(this.curr, this.target);
            this.target.isHovered = false;
            this.target = undefined;
        }
    }
    checkHovered(x: number, y: number) {
        this.curr = this.updateHoveredVertex(this.curr, x, y);
    }
    private updateHoveredVertex(curr: Vertex<V>, x: number, y: number) {
        let changed = false,
            prev: Vertex<V> = curr;

        let { index } = this.getVertexAtPoint(x, y);
        curr = this.vertices[index];

        if (curr !== prev) {
            if (curr) {
                curr.isHovered = true;
                // move to front
                this.vertices.splice(index, 1);
                this.vertices.unshift(curr);
            }
            if (prev) prev.isHovered = false;
            this.redraw();
        }
        return curr;
    }
}

export default Model;