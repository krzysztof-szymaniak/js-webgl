"use strict";
window.addEventListener("load", () => {
	main(); 
});

function resizeCanvas(canvasElement) {
        let displayWidth = canvasElement.clientWidth;
        let displayHeight = canvasElement.clientHeight;

        if (canvasElement.width !== displayWidth || canvasElement.height !== displayHeight) { // if dimensions changed
            canvasElement.width = displayWidth;
            canvasElement.height = displayHeight;
        }
    }

function createShader(gl, type, source) {
	var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}


const ATTRIBUTE_POSITION = 4;
const ATTRIBUTE_COLOR = 5;

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.bindAttribLocation(program, ATTRIBUTE_POSITION, "a_position");  // bind indices to attribute variables
	gl.bindAttribLocation(program, ATTRIBUTE_COLOR, "a_color");
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

function main() {
	var canvas = document.querySelector("#canvas");
	var gl = canvas.getContext("webgl");
	if (!gl) {
		console.log("No gl");
		return;
	}	
	// Get the strings for our GLSL shaders
	var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
	var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

	// create GLSL shaders, upload the GLSL source, compile the shaders
	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	// Link the two shaders into a program	
	var program = createProgram(gl, vertexShader, fragmentShader);
	
	var resLocation = gl.getUniformLocation(program, "u_resolution");

	
	let primitiveType = gl.POINTS;
    let redraw = false;
	let positions = [];
	let colors = [];
	
	
	document.getElementById("buttons_div").addEventListener('click', event => {
       if (event.target.id && event.target.id != "curr_label" && event.target.id != "buttons_div") {
			let type = event.target.id.toUpperCase();
			primitiveType = gl[type];     
			document.getElementById("curr_label").textContent = `Current mode: \r\n ${type.replace('_', ' ')}`;
			redraw = true;
        }
    });
	
	canvas.addEventListener('click', event => {
        redraw = true;
		positions.push(event.offsetX, event.offsetY);  // coords relative to canvas space
        colors.push(Math.random(), Math.random(), Math.random(), 1);  // random RGB and opacity = 1
    });
	
	function renderFrame() {
        if (redraw) {
            redraw = false;
			draw(gl, program, resLocation, primitiveType, positions, colors);
        }
        requestAnimationFrame(renderFrame);
    }
    renderFrame();
}

function draw(gl, program, resLocation, primitiveType, positions, colors){
	resizeCanvas(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
	
	gl.useProgram(program);
	gl.uniform2f(resLocation, gl.canvas.width, gl.canvas.height);  // pass dimensions to shader uniform
	
	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	
	var colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	
	gl.enableVertexAttribArray(ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    let size = 2;
    let type = gl.FLOAT;
    let normalize = false;
    let stride = 0;
    let offset = 0;
    gl.vertexAttribPointer(ATTRIBUTE_POSITION, size, type, normalize, stride, offset);

    // colors
    gl.enableVertexAttribArray(ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    size = 4;
	type = gl.FLOAT;
    normalize = false;
    stride = 0;
    offset = 0;
    gl.vertexAttribPointer(ATTRIBUTE_COLOR, size, type, normalize, stride, offset);

    gl.drawArrays(primitiveType, 0, positions.length/2);
	
	let numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for (let i = 0; i < numAttribs; ++i) {
		let info = gl.getActiveAttrib(program, i);
		console.log('name:', info.name, 'type:', info.type, 'size:', info.size);
	}
	numAttribs = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	for (let i = 0; i < numAttribs; ++i) {
		let info = gl.getActiveUniform(program, i);
		console.log('name:', info.name, 'type:', info.type, 'size:', info.size);
	}
	console.log("==================================================");

}