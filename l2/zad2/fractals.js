"use strict";
window.addEventListener('load', () => {
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
//const ATTRIBUTE_COLOR = 5;

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.bindAttribLocation(program, ATTRIBUTE_POSITION, "a_position");  // bind indices to attribute variables
	//gl.bindAttribLocation(program, ATTRIBUTE_COLOR, "a_color");
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

function main(){
	const koch_button = document.getElementById("run_koch");
	const sierp_button = document.getElementById("run_sierp");
	const input = document.getElementById("degree_input");
	const degree_label = document.getElementById("degree_label");
	const red_input = document.getElementById("red_input");
	const red_label = document.getElementById("red_label");
	const green_input = document.getElementById("green_input");
	const green_label = document.getElementById("green_label");
	const blue_input = document.getElementById("blue_input");
	const blue_label = document.getElementById("blue_label");
	
	const canvas = document.querySelector("#canvas");
	
	degree_label.textContent = `Degree: ${input.value}`;
	input.addEventListener('input', () => {
		degree_label.textContent = `Degree: ${input.value}`;
	});
	red_label.textContent = `Red: ${red_input.value}`;
	red_input.addEventListener('input', () => {
		red_label.textContent = `Red: ${red_input.value}`;
	});
	green_label.textContent = `Green: ${green_input.value}`;
	green_input.addEventListener('input', () => {
		green_label.textContent = `Green: ${green_input.value}`;
	});
	blue_label.textContent = `Blue: ${blue_input.value}`;
	blue_input.addEventListener('input', () => {
		blue_label.textContent = `Blue: ${blue_input.value}`;
	});
	
	const gl = canvas.getContext('webgl');
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
	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(program);
	const colorLocation = gl.getUniformLocation(program, "u_color");
	
	let kochs = [];
	let sierps = [];
	var activeShape = null;
	const a = 1;  // base triangle side
	const starters = [  // base triangle points
		{x:-0.5*a, y:-a*Math.sqrt(3)/6, z:0, updated:false}, 
		{x:0.5*a, y:-a*Math.sqrt(3)/6, z:0, updated:false}, 
		{x:0, y:a*Math.sqrt(3)/3, z:0, updated:false}
		];
	
	sierp_button.addEventListener('click', () => {
		let degree = input.value;
		let r = red_input.value/255;  // normalize value
		let g = green_input.value/255;
		let b = blue_input.value/255;
		let pointSet = generateSierp(degree, JSON.parse(JSON.stringify(starters)));  // clone starting points to prevent curves from sharing them
		let shape = {points: pointSet, color:{red:r, green:g, blue:b, alpha:1.0}};
		sierps.push(shape);
		createDiv(shape, 'Sierpinski');
		drawFractals(gl, colorLocation, kochs, sierps);
	});
	
	
	koch_button.addEventListener('click', () => {
		let degree = input.value;
		let r = red_input.value/255;  
		let g = green_input.value/255;
		let b = blue_input.value/255;
		let pointSet = generateKoch(degree, JSON.parse(JSON.stringify(starters)));
		let shape = {points: pointSet, color:{red:r, green:g, blue:b, alpha:1.0}};
		kochs.push(shape);
		createDiv(shape, 'Koch');
		drawFractals(gl, colorLocation, kochs, sierps);
	});
	
	function createDiv(shape, type){
		const container = document.getElementById('frac_info');
		const panel = document.createElement('div');
		panel.className = 'panel';
		panel.style.backgroundColor = `rgb(${Math.floor(shape.color.red *255)}, ${Math.floor(shape.color.green *255)}, ${Math.floor(shape.color.blue * 255)})`; 
        const text = document.createElement('p');
		text.textContent = `${type}`;
		panel.addEventListener('click', () => {			
			activeShape = shape;
		});
		panel.append(text);
		container.append(panel);
	}

	
	window.addEventListener('keydown', (event) => {
		if (activeShape == null)
			return;
		switch(event.key){  // prevent points from updating multiple times
			case 'w': activeShape.points.forEach(p => {if(!p.updated) {p.y += 0.05; p.updated = true;}}); break;
			case 's': activeShape.points.forEach(p => {if(!p.updated) {p.y -= 0.05; p.updated = true;}}); break;
			case 'a': activeShape.points.forEach(p => {if(!p.updated) {p.x -= 0.05; p.updated = true;}}); break;
			case 'd': activeShape.points.forEach(p => {if(!p.updated) {p.x += 0.05; p.updated = true;}}); break;			
			case 'q': activeShape.points.forEach(p => {if(!p.updated) {p.z += 0.05; p.updated = true;}}); break;
			case 'e': activeShape.points.forEach(p => {if(!p.updated) {p.z -= 0.05; p.updated = true;}}); break;
			default: return;
		}
		activeShape.points.forEach(p => {p.updated = false;});		
		drawFractals(gl, colorLocation, kochs, sierps);
	});
}



function drawFractals(gl, colorLocation, kochs, sierps){
	resizeCanvas(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
	console.log(kochs);
	console.log(sierps);
	
	
	kochs.forEach(k => {
		gl.uniform4f(colorLocation, k.color.red, k.color.green, k.color.blue, k.color.alpha);  // pass dimensions to shader uniform
	
		var positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		let positions = k.points.reduce((acc, e) => [...acc, e.x, e.y, e.z], []); // flatten point list
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(ATTRIBUTE_POSITION);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		let size = 3;
		let type = gl.FLOAT;
		let normalize = false;
		let stride = 0;
		let offset = 0;
		gl.vertexAttribPointer(ATTRIBUTE_POSITION, size, type, normalize, stride, offset);
		gl.drawArrays(gl.LINE_STRIP, 0, k.points.length);
	});
	sierps.forEach(s => {
		gl.uniform4f(colorLocation, s.color.red, s.color.green, s.color.blue, s.color.alpha);  // pass dimensions to shader uniform
	
		var positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		let positions = s.points.reduce((acc, e) => [...acc, e.x, e.y, e.z], []); // flatten point list
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(ATTRIBUTE_POSITION);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		let size = 3;
		let type = gl.FLOAT;
		let normalize = false;
		let stride = 0;
		let offset = 0;
		gl.vertexAttribPointer(ATTRIBUTE_POSITION, size, type, normalize, stride, offset);
		gl.drawArrays(gl.TRIANGLES, 0, s.points.length);
	});
}




function generateSierp(degree, starters){
		return sierp(degree, starters[0], starters[1], starters[2]);
	}
	
	function generateKoch(degree, starters){
		let res = [];
		res = res.concat(koch(degree, starters[0], starters[1]));
		res = res.concat(koch(degree, starters[1], starters[2]));
		res = res.concat(koch(degree, starters[2], starters[0]));
		return res;
	}
	
	function sierp(degree, A, B, C){		
		if (degree == 0){
			return [A, B, C];
		}
		else{
			// calcuate middle points on each side
			let P = {
				x: A.x/2 + B.x/2,
				y: A.y/2 + B.y/2,
				z: B.z,
				updated:false
			};
			let Q = {
				x: A.x/2 + C.x/2,
				y: A.y/2 + C.y/2,
				z: B.z,
				updated:false
			};
			let R = {
				x: B.x/2 + C.x/2,
				y: B.y/2 + C.y/2,
				z: B.z,
				updated:false
			}; // draw 3 more triangles
			let res = [];
			res = res.concat(sierp(degree-1, A, P, Q));
			res = res.concat(sierp(degree-1, B, P, R));
			res = res.concat(sierp(degree-1, C, Q, R));
			return res;
		}
		
		
	}
	
	function koch(degree, A, B){
		let v = { // vector from A -> B
			x: B.x - A.x, 
			y: B.y - A.y,
		};
		// points form this kind of shape:
		//     Q
		// A-P/ \R-B 
		//
		let P = {
			x: A.x + v.x/3, 
			y: A.y + v.y/3,
			z: B.z,
			updated:false
		};
						
		let R = {
			x: A.x + 2*v.x/3, 
			y: A.y + 2*v.y/3,
			z: B.z,
			updated:false
		};
		let r = rotate_vec(P.x - R.x, P.y - R.y, 2*Math.PI/3);
		let Q = {
			x: P.x + r.x,
			y: P.y + r.y,
			z: B.z,
			updated:false
		};
		
		if (degree == 1){
			return [A, P, Q, R, B];
		}
		else{  // call koch on each of 4 new sections
			let res = [];
				
			res = res.concat(koch(degree - 1, A, P));
			res = res.concat(koch(degree - 1, P, Q));
			res = res.concat(koch(degree - 1, Q, R));
			res = res.concat(koch(degree - 1, R, B));
			return res;
		}
	}
	
	function rotate_vec(x, y, angle){
		let rx = x*Math.cos(angle) - y*Math.sin(angle);
		let ry = x*Math.sin(angle) + y*Math.cos(angle);
		return {x: rx, y: ry};
	}

