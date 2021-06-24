var drawAnaglyph = false;
var drawTriangles = false;
var drawTwoPlanes = false;
var useStencil = false;


window.addEventListener('load', () => {
    const input = document.getElementById('functionInput');
    const xInput = document.getElementById('xInput');
    const yInput = document.getElementById('yInput');
    const button = document.getElementById('draw');
    const clearBtn = document.getElementById('clear');
    const triangles = document.getElementById('triangles');
    const anaglyph = document.getElementById('anaglyph');
    const twoGraphs = document.getElementById('twoGraphs');
    const stencilCheck = document.getElementById('useStencil');

    drawTriangles = triangles.checked;
    drawAnaglyph = anaglyph.checked;
    drawTwoPlanes = twoGraphs.checked;
    useStencil = stencilCheck.checked;

    triangles.addEventListener('click', (e) => {
        window.location.reload();
    });

    stencilCheck.addEventListener('click', (e) => {
        window.location.reload();
    });

    anaglyph.addEventListener('click', (e) => {
        drawAnaglyph = anaglyph.checked;
        if(twoGraphs.checked){
            twoGraphs.checked = false;
            drawTwoPlanes = false;
        }

    });

    twoGraphs.addEventListener('click', (e) => {
        drawTwoPlanes = twoGraphs.checked;
        if(anaglyph.checked){
            anaglyph.checked = false;
            drawAnaglyph = false;
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            run();
        }
    });

    button.addEventListener('click', e => {        
        run();
    });
    clearBtn.addEventListener('click', e => {        
        window.location.reload();
    });

    function run() {
     with(Math){
                let func = eval(`(x, y) => ${input.value}`); 
                let xRange = eval(xInput.value); 
                let yRange = eval(yInput.value); 
                main(func, xRange, yRange);
            } 
        }
});

function main(func, xRange, yRange){
    const canvas = document.querySelector("#canvas");
    
    const gl = canvas.getContext('webgl', {stencil : true});
    if (!gl) {
        console.log("No gl");
        return;
    }
    
    const engine = new DrawingEngine(gl, useStencil);
    const graph = prepareGraph(func, xRange, yRange);

    // Compute the camera's matrix
    let camera = [0, -500, -100];
    let target = [0, 0, 0];
    let up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera, target, up);

    var xRot = -Math.PI/6;
    var yRot = 0;
    var zRot = 0;
    var doRotation = true;


    var drag = false;
    canvas.addEventListener('mousemove', () =>{
        if (drag){
            xRot -= event.movementY/100;
            yRot += event.movementX/100;
        }
    });
    canvas.addEventListener('mousedown', () => drag = true);
    canvas.addEventListener('mouseup', () => drag = false);
    canvas.addEventListener('mouseout', () => drag = false);

    
    engine.bufferGraph(graph, drawTriangles);
    

    const key_map = {  
        // translate camera      
        'w': {active: false, callback: (dt) => {
            var alpha= 1;
            let a = dt * alpha;
            cameraMatrix=m4.translate(cameraMatrix, 0, 0, -a,);
        }},
        's': {active: false, callback: (dt) => {
            var alpha= 1;
            let a = dt * alpha;
            cameraMatrix=m4.translate(cameraMatrix, 0, 0,a );
        }},
        'a': {active: false, callback: (dt) => {
            var alpha= 1;
            let a = dt * alpha;
            cameraMatrix=m4.translate(cameraMatrix, -a, 0, 0  );
        }},
        'd': {active: false, callback: (dt) => {
            var alpha= 1;
            let a = dt * alpha;
            cameraMatrix=m4.translate(cameraMatrix, a, 0, 0);
        }},
        'r': {active: false, callback: (dt) => {
            var alpha= 1;
            let a = dt * alpha;
            cameraMatrix=m4.translate(cameraMatrix, 0,a, 0);
        }},
        'f': {active: false, callback: (dt) => {
            var alpha= 1;
            let a = dt * alpha;
            cameraMatrix=m4.translate(cameraMatrix, 0, -a, 0);
        }},

        // rotate camera 
        'u': {active: false, callback: (dt) => {
            var alpha= Math.PI/1800;
            let a = dt * alpha;
            cameraMatrix=m4.xRotate(cameraMatrix, a);
        }}, 
        'i': {active: false, callback: (dt) => {
            var alpha= Math.PI/1800;
            let a = dt * alpha;
            cameraMatrix=m4.xRotate(cameraMatrix, -a);
        }}, // y
        'j': {active: false, callback: (dt) => {
            var alpha= Math.PI/1800;
            let a = dt * alpha;
            cameraMatrix=m4.yRotate(cameraMatrix, a);
        }},
        'k': {active: false, callback: (dt) => {
            var alpha= Math.PI/1800;
            let a = dt * alpha;
            cameraMatrix=m4.yRotate(cameraMatrix, -a);
        }},
        'n': {active: false, callback: (dt) => {
            var alpha= Math.PI/1800;
            let a = dt * alpha;
            cameraMatrix=m4.zRotate(cameraMatrix, a);
        }},
        'm': {active: false, callback: (dt) => {
            var alpha= Math.PI/1800;
            let a = dt * alpha;
            cameraMatrix=m4.zRotate(cameraMatrix, -a);
        }},

        // reset positions
        ' ': {active: false, callback: (dt) => {            
            cameraMatrix=m4.lookAt(camera, target, up);
            xRot = -Math.PI/6;
            yRot = 0;
            zRot = 0;
            doRotation = true;
        }},
        'Escape': {active: false, callback: (dt) => {            
            doRotation = !doRotation;
        }},

    };
     window.addEventListener('keydown', (event) => {
        if (key_map[event.key]) { 
            key_map[event.key].active = true;
        }
    });
    
    window.addEventListener('keyup', (event) => {
        if (key_map[event.key]) { 
            key_map[event.key].active = false;
        }
    });



    function tick(dt){
        Object.values(key_map).forEach(key => {
            if (key.active) key.callback(dt);
        });
    }
    

    var prevTime = 0;

    function drawLoop(timestamp) {
        let dt = timestamp - prevTime;
        tick(dt);
        prevTime = timestamp;
        //let viewMatrix = m4.inverse(cameraMatrix);
        let dz = dt * 0.00005;
        
        if(doRotation) { // for some js reason zRot can be here NaN
            zRot = zRot ? zRot : 0;
            zRot += dz;
        } 
        if (zRot > 2* Math.PI)
            zRot -= 2* Math.PI;
        
        engine.draw(cameraMatrix, xRot, yRot, zRot, drawTwoPlanes, drawAnaglyph);
        requestAnimationFrame(drawLoop);
    }
    drawLoop();
    
}

function prepareGraph(func, xRange, yRange) {
    const points = [];
    const normals = [];
    let numPoints = 500;
    
    const dx = Math.abs(xRange[1] - xRange[0])/numPoints;
    const dy = Math.abs(yRange[1] - yRange[0])/numPoints;
    const scaleUp = 30;
    const xStart = xRange[0];
    const yStart = yRange[0];

    for (let i = 0; i< numPoints; i++) {
        for (let j = 0; j < numPoints; j++){
            let x0 = xStart + i * dx;
            let y0 = yStart + j * dy;
            let p0 = func(x0, y0) * scaleUp; // scale value up so it looks more distinguishable;
            if (drawTriangles){
                let x1 = xStart + (i+1) * dx;
                let y1 = yStart + (j+1) * dy;

                let p1 = func(x1, y0) * scaleUp;
                let p2 = func(x1, y1) * scaleUp;
                let p3 = func(x0, y1) * scaleUp;
                /*
                    square area unit
                    p3(x0,y1) -- p2(x1, y1)
                        |    \       |
                        |      \     |
                    p0(x0,y0) -- p1(x1, y0)
                */
                let firstHalf = [
                    i, j, p0,
                    i+1, j, p1,
                    i, j+1, p3
                ];
                let secondHalf = [                  
                    i+1, j, p1,
                    i, j+1, p3,
                    i+1, j+1, p2,

                ];
                points.push(
                    ...firstHalf,
                    ...secondHalf
                );
                normals.push(
                    ...triangleNormal(...firstHalf),
                    ...triangleNormal(...firstHalf),
                    ...triangleNormal(...firstHalf),
                    ...triangleNormal(...secondHalf, true),
                    ...triangleNormal(...secondHalf, true),
                    ...triangleNormal(...secondHalf, true)
                );
            } 
            else{
                points.push(i, j, p0);
            }
        }
    }
    return {points: points, normals: normals};
}

function triangleNormal(x0, y0, z0, x1, y1, z1, x2, y2, z2, swap = false) {  
    /*
        T = (p0[x0, y0, z0], p1[x1, y1, z1], p2[x2, y2, z2])
        A = p1 - p0
        B = p2 - p0 
        
    */
    let Ax = x1 - x0;
    let Ay = y1 - y0;
    let Az = z1 - z0;

    let Bx = x2 - x0;
    let By = y2 - y0;
    let Bz = z2 - z0;

    // normal vector dirction depends on the order of verices,
    // swap vectors on second triangle to make sure normals are pointing in the same direction
    if (swap) { 
        [Ax, Bx] = [Bx, Ax];
        [Ay, By] = [By, Ay];
        [Az, Bz] = [Bz, Az];
    }

    let Nx = Ay * Bz - Az * By;
    let Ny = Az * Bx - Ax * Bz;
    let Nz = Ax * By - Ay * Bx;
    return [Nx, Ny, Nz];
}


