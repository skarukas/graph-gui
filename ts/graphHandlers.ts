import Model from "./graphModel";

export default function addHandlers(canvas: HTMLCanvasElement, model: Model<any, any>) {
    const modifiers = {
        mouseDown: false,
        ctrlDragged: false,
        ctrlPressed: false,
        shiftPressed: false,
        shiftDragged: false
    }
     
    // CANVAS EVENT LISTENERS
    canvas.onmousemove = (e: MouseEvent) => {
        if (modifiers.mouseDown) {
            if (modifiers.ctrlDragged && !modifiers.shiftDragged) model.ctrlDragTo(e.x, e.y);
            else if (modifiers.shiftDragged) model.shiftKeyAt(e.x, e.y);
            else model.dragTo(e.x, e.y);
        } else {
            model.checkHovered(e.x, e.y);
        }   
    }

    canvas.onmousedown = (e: MouseEvent) => {
        modifiers.ctrlDragged = modifiers.ctrlPressed;
        modifiers.mouseDown = true;
        modifiers.shiftDragged = modifiers.shiftPressed
        if (modifiers.shiftPressed) model.shiftKeyAt(e.x, e.y);
    }
    canvas.onmouseup = (e: MouseEvent) => {
        modifiers.ctrlDragged = false;
        modifiers.shiftDragged = false;
        modifiers.mouseDown = false;
        model.releaseDrag();
        model.checkHovered(e.x, e.y);
    }

    function isControlKey(e: KeyboardEvent) {
        return e.key == "Meta" || e.key == "Ctrl";
    }

    canvas.oncontextmenu = (e: MouseEvent) => {
        e.preventDefault();
        model.rightClick(e.x, e.y);
        modifiers.mouseDown = false;
        return false;
    }

    // WINDOW EVENT LISTENERS

    window.onkeydown = (e: KeyboardEvent) => {
        if (e.key == "Shift") {
            canvas.style.cursor = "not-allowed"
            modifiers.shiftPressed = true;
        } else if (isControlKey(e)) {
            canvas.style.cursor = "crosshair"
            modifiers.ctrlPressed = true;
        }
    }
    window.onkeyup = (e: KeyboardEvent) => {
        if (isControlKey(e)) {
            canvas.style.cursor = "auto"
            modifiers.ctrlPressed = false;
        } else if (e.key == "Shift") {
            canvas.style.cursor = "auto"
            modifiers.shiftPressed = false;
        }
    }  
    window.onresize = resizeCanvas;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        model.redraw();
    }
    resizeCanvas();
}