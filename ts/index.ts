import Graph from "./graphPrefs";
let defaultCanvas = document.getElementById("graph-gui") as HTMLCanvasElement;

export default function graph(canvas: HTMLCanvasElement = defaultCanvas) {
    return new Graph(canvas);
}

/* 
import graph from "./graphPrefs";
import { Vertex, Color } from "./graphClasses";

;(function() {  
    function fadeIn(vertex: Vertex) {
        transitionColors(graph.vertexPrefs.stdColor as Color, graph.vertexPrefs.hoveredColor as Color, 500, (c: Color) => vertex.draw(c));
    }
    function transitionColors(from: Color, to: Color, ms: number, callback, fps = 29) {
        let frameCount = (ms / 1000) * fps,
            trans = true,
            incVals = from.getDiff(to).map(n => n / frameCount);
    
        setTimeout(() => trans = false, ms);
    /*     while (trans) {
            setInterval(() => {
                from.increment(incVals);
            }, 1000 / fps);
        }
        callback(from);
    }
})()
*/ 