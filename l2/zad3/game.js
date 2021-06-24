"use strict";
window.addEventListener('load', () => {
	main();
});

const PLAYER_WIDTH = 150;
const PLAYER_HEIGHT = 20;
const PLAYER_DX = 0.25;

const BALL_SPEED = 0.4;
const BALL_NO_FANS = 15;
const BALL_RADIUS = 5;
const MAX_BOUNCE_ANGLE = 75 * Math.PI/180;

const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_MARGIN_X = 0;
const BRICK_MARGIN_Y = 0;

const BACKGROUD_DEPTH = 1/2;
const STAR_DEPTH = 1/3;
const STAR_NUM = 20;
const BASE_DEPTH = 1/4;
const numRows = 6;

const IS_TEXTURED = true;


function resizeCanvas(canvasElement) {
        let displayWidth = canvasElement.clientWidth;
        let displayHeight = canvasElement.clientHeight;

        if (canvasElement.width !== displayWidth || canvasElement.height !== displayHeight) { // if dimensions changed
            canvasElement.width = displayWidth;
            canvasElement.height = displayHeight;
        }
    }
function clone(object){
	return JSON.parse(JSON.stringify(object));
}

function main() {
	const canvas = document.querySelector("#canvas");
	
	const gl = canvas.getContext('webgl');
	if (!gl) {
		console.log("No gl");
		return;
	}
	var objects = [];
	
	const engine = new DrawingEngine(gl);
	
	const player = new Player({x: gl.canvas.clientWidth/2, y: 13/14*gl.canvas.clientHeight}, PLAYER_WIDTH, PLAYER_HEIGHT, randColor(), IS_TEXTURED);
	const background = new Background(gl.canvas.width, gl.canvas.height, [0, 0, 0, 1], IS_TEXTURED);
	var ball = new Ball({x: player.center.x, y: player.center.y - BALL_RADIUS - PLAYER_HEIGHT/2}, randColor(), IS_TEXTURED);
	var isBallFlying = false;
	var prevTime = performance.now();
	var frameID = 0;
	objects.push(player);
	objects.push(background);
	objects.push(ball);
	if (IS_TEXTURED){
		engine.loadTexture(player, 'textures/board.png');
		engine.loadTexture(ball, 'textures/ball.png');
		engine.loadTexture(background, 'textures/space.jpg');
	}
	const key_map = {
		'a': {active: false, callback: (dt) => {
			const dist = dt * PLAYER_DX;
			const max = gl.canvas.clientWidth/2 - player.width/2;
			player.translation.x -= dist;
			if (player.translation.x < -max)
				player.translation.x = -max;
			if(!isBallFlying){
				ball.translation.x = player.translation.x;
			}
		}},
		'd': {active: false, callback: (dt) => {
			const dist = dt * PLAYER_DX;
			const max = gl.canvas.clientWidth/2 - player.width/2;
			player.translation.x += dist;
			if (player.translation.x > max)
				player.translation.x = max;
			if(!isBallFlying){
				ball.translation.x = player.translation.x;
			}
		}},
		'ArrowLeft': {active: false, callback: (dt) => {
			const dist = dt * PLAYER_DX;
			const max = gl.canvas.clientWidth/2 - player.width/2;
			player.translation.x -= dist;
			if (player.translation.x < -max)
				player.translation.x = -max;
			if(!isBallFlying){
				ball.translation.x = player.translation.x;
			}
		}},
		'ArrowRight': {active: false, callback: (dt) => {
			const dist = dt * PLAYER_DX;
			const max = gl.canvas.clientWidth/2 - player.width/2;
			player.translation.x += dist;
			if (player.translation.x > max)
				player.translation.x = max;
			if(!isBallFlying){
				ball.translation.x = player.translation.x;
			}
		}},
	};
	window.addEventListener('keydown', (event) => {
		if (key_map[event.key]) key_map[event.key].active = true;
	});
	
	window.addEventListener('keyup', (event) => {
		if (key_map[event.key]) key_map[event.key].active = false;
	});
	function tick(dt){
		Object.values(key_map).forEach(key => {
            if (key.active) key.callback(dt);
        });
	}
	window.addEventListener('keydown', (event) => {
			switch(event.key){ 
				case ' ':
					event.preventDefault();
					if (!isBallFlying){
						isBallFlying = true;
						let startingAngle = Math.random()*(135 - 45) + 45;
						ball.movement.y = -BALL_SPEED * Math.sin(startingAngle * Math.PI/180);
						ball.movement.x = BALL_SPEED * Math.cos(startingAngle * Math.PI/180);							
					}
					break;
				case 'r':  // reset 
					isBallFlying = false;
					ball.movement = {x:0, y:0};
					ball.translation = clone(player.translation);												
					break;
				case 'Escape':
					if (frameID == 0){
						console.log("Animation started");
						frameID = requestAnimationFrame(gameLoop);
					}
					else{	
						console.log("Animation stopped");					
						cancelAnimationFrame(frameID);
						frameID = 0;
					}
					break;
				
			}
		});
	let color1 = [168/255, 168/255, 50/255, 1];
	let color2 = [177/255, 191/255, 227/255, 1];
	for (let i=0; i < STAR_NUM; i++){
		let sx = Math.random() * gl.canvas.width;
		let sy = Math.random() * gl.canvas.height;
		objects.push(new Star([sx, sy], Math.random() < 0.7? color1 : color2, false));
	}
	var bricks = generateBricks();
	engine.draw(objects.concat(bricks));
	gameLoop();
	
	
	////////////////////////////////////////////////////////////////////////////
	function gameLoop(timestamp){
		let checks;
		let DT = timestamp - prevTime;  // one big move
		let balldx = Math.abs(DT*ball.movement.x);
		let balldy = Math.abs(DT*ball.movement.y);

		let ball_y = ball.center.y + ball.translation.y; 
		if((balldx > BRICK_WIDTH/2 || balldy > BRICK_HEIGHT/2) && ball_y < gl.canvas.height/3){
			checks = 3;
		}
		else{
			checks = 1;
		}
		console.log(checks);
		let dt = DT/checks; // split one big move into series of smaller ones
		
		for(let i = 0; i < checks; i++){
			tick(dt);
			if (isBallFlying){
				handleCollisions(dt);
			}	
		}			
		engine.draw(objects.concat(bricks));
		if(bricks.length == 0){
			alert("Congratulations, you won!");
			location.reload();
		}
		prevTime = timestamp;
		frameID = requestAnimationFrame(gameLoop);
	}
	function handleCollisions(dt){
		let [ballX, ballY] = moveBall(dt);
		for (let b of bricks){
			checkCollision(b, ballX, ballY);
		}
		
		checkCollisionWithPlayer(ballX, ballY);
		if (ballY > gl.canvas.height){
			isBallFlying = false;
			ball.movement = {x:0, y:0};
			ball.translation = clone(player.translation);
		}
		bricks = bricks.filter((b) => {return !b.isHit});
	}
	function moveBall(dt){
		const maxX = gl.canvas.clientWidth/2 - BALL_RADIUS;
		const minY = -ball.center.y + BALL_RADIUS;
		ball.translation.x += dt * ball.movement.x;
		ball.translation.y += dt * ball.movement.y;
		if (ball.translation.x < - maxX){
			ball.movement.x *= -1;
			ball.translation.x = -maxX;
		}
		if(ball.translation.x > maxX){
			ball.movement.x *= -1;
			ball.translation.x = maxX;
		}
		if (ball.translation.y < minY){
			ball.movement.y *= -1;
			ball.translation.y = minY;
		}
		let ballX = ball.center.x + ball.translation.x;
		let ballY = ball.center.y + ball.translation.y;
		return [ballX, ballY];
	}
	function checkCollisionWithPlayer(ballX, ballY){
		let playerX = player.center.x + player.translation.x;
		let playerY = player.center.y + player.translation.y;
		let xDist = Math.abs(ballX - playerX) - PLAYER_WIDTH/2;
		let yDist = Math.abs(ballY - playerY) - PLAYER_HEIGHT/2;
		if ((xDist < ball.radius && yDist < 0) || (yDist < ball.radius && xDist < 0) || (xDist**2 + yDist**2 < ball.radius**2)) {
			if (xDist < yDist){
				// vertical collison
				bouncePlayer(ballX, playerX);
			}
			else {
				//horizontal colission				
				ball.movement.x *= -1;
			}
		}
	}
	function bouncePlayer(ballX, playerX){
		let ratio = (playerX + PLAYER_WIDTH/2 - ballX)/(PLAYER_WIDTH/2);
		let angle = ratio * MAX_BOUNCE_ANGLE;
		ball.movement.x = BALL_SPEED * Math.cos(angle);
		ball.movement.y = -BALL_SPEED * Math.sin(angle);
	}
	function checkCollision(brick, ballX, ballY){
		let xDist = Math.abs(ballX - brick.center.x) - brick.width / 2;
		let yDist = Math.abs(ballY - brick.center.y) - brick.height / 2;

		if ((xDist < ball.radius && yDist < 0) || (yDist < ball.radius && xDist < 0) || (xDist**2 + yDist**2 < ball.radius**2)) {
			brick.isHit = true;
			if (xDist < yDist){
				// vertical collison
				ball.movement.y *= -1;
			}
			else {
				//horizontal colission
				ball.movement.x *= -1;
			}
		}
		
	}
	///////////////////////////////////////////////////////////////////////////////	
	function generateBricks(){
		let colors = [
			[140/255, 140/255, 140/255, 1],
			[204/255, 0, 0, 1],
			[204/255, 204/255, 0, 1],
			[0, 0, 153/255, 1],
			[71/255, 0, 179/255, 1],
			[0, 128/255, 0, 1],
			
		];
		let textureSrc =[
			'textures/white.png',
			'textures/red.png',
			'textures/orange.png',
			'textures/blue.png',
			'textures/purple.png',
			'textures/green.png'
		];
		let numCols = Math.floor(gl.canvas.width/BRICK_WIDTH);
		let cy = 1/8 * gl.canvas.height;
		let res = [];
		for (let i=0; i < numRows; i++){
			let cx = BRICK_WIDTH/2;
			for (let j=0; j < numCols; j++) {
				let b = new Brick({x: cx, y: cy}, BRICK_WIDTH, BRICK_HEIGHT, colors[i], IS_TEXTURED);
				res.push(b);
				if (IS_TEXTURED){
					engine.loadTexture(b, textureSrc[i]);
				}
				cx += BRICK_WIDTH + BRICK_MARGIN_X;				
			}
			cy += BRICK_HEIGHT + BRICK_MARGIN_Y;
		}
		return res;		
	}
}

function randColor(){
	return [Math.random(), Math.random(), Math.random(), 1];
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

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	//gl.bindAttribLocation(program, ATTRIBUTE_POSITION, "a_position");  // bind indices to attribute variables
	//gl.bindAttribLocation(program, ATTRIBUTE_COLOR, "a_color");
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class DrawingEngine {
	constructor(gl){
		this.gl = gl;
		// Get the strings for our GLSL shaders
		var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
		var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
	
		// create GLSL shaders, upload the GLSL source, compile the shaders
		var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	
		
		this.program = createProgram(gl, vertexShader, fragmentShader);
			
		
		this.uniforms = {		 
			matrix: this.gl.getUniformLocation(this.program, "u_matrix"),
			depth: this.gl.getUniformLocation(this.program, "u_depth"),
			isTextured: this.gl.getUniformLocation(this.program, "u_istextured"),
			texture: this.gl.getUniformLocation(this.program, "u_texture"),
			pointSize:  this.gl.getUniformLocation(this.program, "u_point_size")
		};
		this.attributes = {
			position: this.gl.getAttribLocation(this.program, "a_position"),
			color: this.gl.getAttribLocation(this.program, "a_color"),
			texcoord: this.gl.getAttribLocation(this.program, "a_texcoord")
		};
			
		
		resizeCanvas(this.gl.canvas);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.useProgram(this.program);
	}
	
	getBuffer(data){
		const buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.DYNAMIC_DRAW);
		return buffer;	
	}
	
	loadTexture(object, texSrc){
		object.isTextured = true;
		object.texcoords = [						
			0, 0,
            1, 0,
			1, 1,            
            
		];
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		this.gl.texImage2D(
		  this.gl.TEXTURE_2D,
		  0,
		  this.gl.RGBA,
		  1,
		  1,
		  0,
		  this.gl.RGBA,
		  this.gl.UNSIGNED_BYTE,
		  new Uint8Array([0, 255, 0, 255])
		);

		const image = new Image();
		image.src = texSrc;
		image.addEventListener("load", () => {
		  this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		  this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.RGBA,
			this.gl.RGBA,
			this.gl.UNSIGNED_BYTE,
			image
		  );
		  this.gl.generateMipmap(this.gl.TEXTURE_2D);
		});

		object.texture = texture;
	}
	
	bufferPosition(object){
		this.gl.enableVertexAttribArray(this.attributes.position);
		const positionBuffer = this.getBuffer(object.points);
		this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);
	}
	bufferColor(object) {
		this.gl.uniform1f(this.uniforms.pointSize, object.pointSize);				
		this.gl.enableVertexAttribArray(this.attributes.color);
		const colors = new Array(object.points.length/2 * 4).fill(object.color).flat();  // repeat colors for each point
		const colorBuffer = this.getBuffer(colors);
		this.gl.vertexAttribPointer(this.attributes.color, 4, this.gl.FLOAT, false, 0, 0);
	}
	
	bufferTexture(object){
		this.gl.enableVertexAttribArray(this.attributes.texcoord);
					
		let coords = new Array(object.points.length/2 * 3).fill(object.texcoords).flat();
				
		const texcoordBuffer = this.getBuffer(coords);
		this.gl.vertexAttribPointer(this.attributes.texcoord, 2, this.gl.FLOAT, false, 0, 0);
	}
	
	draw(objects) {
		resizeCanvas(this.gl.canvas);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0, 0, 0, 0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		objects.forEach(object => {		
			this.bufferPosition(object);
			this.bufferColor(object);
			// handle textures
			if (object.isTextured) {
				this.gl.uniform1i(this.uniforms.isTextured, 1); // notify shader to process textures
				this.bufferTexture(object);
				this.gl.bindTexture(this.gl.TEXTURE_2D, object.texture);
				this.gl.uniform1i(this.uniforms.texture, 0);
			} 
			else {
				this.gl.uniform1i(this.uniforms.isTextured, 0);  // notify shader to process colors				
			}
			// Compute the matrices
			let matrix = m3.projection(
				this.gl.canvas.clientWidth,
				this.gl.canvas.clientHeight
			);
			matrix = m3.translate(matrix, object.translation.x, object.translation.y);
			this.gl.uniformMatrix3fv(this.uniforms.matrix, false, matrix);
			this.gl.uniform1f(this.uniforms.depth, object.depth);

			this.gl.drawArrays(this.gl[object.primitiveType], 0, object.points.length / 2);
		});
	}	
}


class Player{
	constructor(center, width, height, color, isTextured){
		this.points = this.position = [
			center.x - width/2, center.y - height/2,  // bot left
			center.x - width/2, center.y + height/2,  // top left
			center.x + width/2, center.y + height/2,  // top right
			center.x - width/2, center.y - height/2,  // bot left
			center.x + width/2, center.y - height/2,  // bot right
			center.x + width/2, center.y + height/2,  // top right		
		];
		this.center = center;
		this.width = width;
		this.height = height;
		this.primitiveType = "TRIANGLES";
		this.translation = {x:0, y:0};
		this.color = color;
		this.depth = BASE_DEPTH;
		this.pointSize = 1;
		this.isTextured = isTextured;
	}
	
}

class Background {
	constructor(width, height, color, isTextured){
		this.depth = BACKGROUD_DEPTH;
		this.translation = {x:0, y:0};
		this.type = 'back';
		this.color = color;
		this.points = [
			0, 0,
			0, height,
			width, height,
			0, 0,
			width, 0,
			width, height			
		];
		this.primitiveType = "TRIANGLES";
		this.pointSize = 1;
		this.isTextured = isTextured;
	}
}

class Star {
	constructor(position, color, isTextured){
		this.depth = STAR_DEPTH;
		this.points = position;
		this.translation = {x:0, y:0};
		this.color = color;
		this.primitiveType = "POINTS";
		this.pointSize = Math.random()*(10.0 - 4.0) + 4.0;
		this.isTextured = isTextured;
	}
}

class Brick {
	constructor(center, width, height, color, isTextured){
		this.center = center;
		this.width = width;
		this.height = height;
		this.isHit = false;
		this.depth = BASE_DEPTH;
		this.color = color;
		this.translation = {x:0, y:0};
		this.points = [
			center.x - width/2, center.y - height/2,  // bot left
			center.x - width/2, center.y + height/2,  // top left
			center.x + width/2, center.y + height/2,  // top right
			center.x - width/2, center.y - height/2,  // bot left
			center.x + width/2, center.y - height/2,  // bot right
			center.x + width/2, center.y + height/2,  // top right		
		];
		this.primitiveType = "TRIANGLES";
		this.pointSize = 1;
		this.isTextured = isTextured;
	}
	
}

class Ball {
	constructor(startingPoint, color, isTextured){
		this.points = this.getVertices(startingPoint);
		this.primitiveType = "TRIANGLE_FAN";
		this.translation = {x:0, y:0};
		this.movement = {x: 0, y: 0};
		this.type = 'ball';
		this.radius = BALL_RADIUS;
		this.center = startingPoint;
		//this.scale = {x:1, y:1};
		this.color = color;
		this.depth = BASE_DEPTH;
		this.pointSize = 1;
		this.isTextured = isTextured;
	}
	
	getVertices(position){
		let anglePerFan = 2*Math.PI / BALL_NO_FANS;
		let vertices = [position.x, position.y];
		for (let i=0; i <= BALL_NO_FANS; i++){
			let angle = i*anglePerFan;
			let vx = position.x + BALL_RADIUS * Math.cos(angle);
			let vy = position.y + BALL_RADIUS * Math.sin(angle);
			vertices.push(vx, vy);
		}
		//console.log(vertices);
		return vertices;
	}
}


// from webglfundamentals.org
//
//
//
const m3 = {
    projection: function(width, height) {
      // Note: This matrix flips the Y axis so that 0 is at the top.
      return [
        2 / width, 0, 0,
        0, -2 / height, 0,
        -1, 1, 1
      ];
    },
  
    identity: function() {
      return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ];
    },
  
    translation: function(tx, ty) {
      return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1,
      ];
    },
  
    rotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      return [
        c,-s, 0,
        s, c, 0,
        0, 0, 1,
      ];
    },
  
    scaling: function(sx, sy) {
      return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1,
      ];
    },
  
    multiply: function(a, b) {
      var a00 = a[0 * 3 + 0];
      var a01 = a[0 * 3 + 1];
      var a02 = a[0 * 3 + 2];
      var a10 = a[1 * 3 + 0];
      var a11 = a[1 * 3 + 1];
      var a12 = a[1 * 3 + 2];
      var a20 = a[2 * 3 + 0];
      var a21 = a[2 * 3 + 1];
      var a22 = a[2 * 3 + 2];
      var b00 = b[0 * 3 + 0];
      var b01 = b[0 * 3 + 1];
      var b02 = b[0 * 3 + 2];
      var b10 = b[1 * 3 + 0];
      var b11 = b[1 * 3 + 1];
      var b12 = b[1 * 3 + 2];
      var b20 = b[2 * 3 + 0];
      var b21 = b[2 * 3 + 1];
      var b22 = b[2 * 3 + 2];
      return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      ];
    },
  
    translate: function(m, tx, ty) {
      return m3.multiply(m, m3.translation(tx, ty));
    },
  
    rotate: function(m, angleInRadians) {
      return m3.multiply(m, m3.rotation(angleInRadians));
    },
  
    scale: function(m, sx, sy) {
      return m3.multiply(m, m3.scaling(sx, sy));
    },
  };