import Graph from "./graphPrefs";
import { Vertex, Edge, Point, Drawable } from "./graphClasses";

// FIX CURR AND TARGET
class View<V,E> {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(private graph: Graph<V,E>) {
        this.canvas = graph.canvas;
        this.context = this.canvas.getContext("2d");
    }
    private drawBackground() {
        this.context.fillStyle = this.graph.backgroundColor.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    private drawEdges(edges: Edge<E>[]) {
        for (let e of edges) e.draw(this.context, this.graph.edgePrefs);
    }
    private drawEdgeText(edges: Edge<E>[]) {
        for (let e of edges) e.drawText(this.context, this.graph.edgePrefs);
    }
    private drawVertices(vertices: Vertex<V>[]) {
        // draw vertices in reverse
        for (let i = vertices.length-1; i >= 0; i--) {
            vertices[i].draw(this.context, this.graph.vertexPrefs);
        }
    }
    private drawVertexText(vertices: Vertex<V>[]) {
        // draw vertex text in reverse
        for (let i = vertices.length-1; i >= 0; i--) {
            vertices[i].drawText(this.context, this.graph.vertexPrefs);
        }
    }
    private drawTitle() {
        this.context.fillStyle = this.graph.vertexPrefs.textColor.toString();
        this.context.textAlign = "center";
        this.context.font = 20 + "px " + this.graph.vertexPrefs.fontFace;
        this.context.fillText("Interactive Graph", this.canvas.width/2, 40);
    
        this.context.font = 10 + "px " + this.graph.vertexPrefs.fontFace;
        this.context.fillText("© Stephen Karukas (github.com/skarukas)", this.canvas.width/2, 54);
    }
    drawLine(start: Point, end: Point) {
        start.lineTo(end).draw(this.context, this.graph.edgePrefs);
    }
    redraw(vertices: Vertex<V>[], edges: Edge<E>[]) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawEdges(edges);
        this.drawEdgeText(edges);
        this.drawVertices(vertices);
        this.drawVertexText(vertices);
        this.drawTitle();
    }
}

export default View;