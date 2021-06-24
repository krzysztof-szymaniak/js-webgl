// Krzysztof Szymaniak 250136

window.addEventListener('load', () => {
	const perspective = 600;  // distance from canvas plane to camera eye in world space 
	const num_shapes = 200;
	const world_size = {
		x: 3000,
		y: 3000,
		z: 3000
	};
	var vel, shiftSide, pitch, yaw, roll;
	var calibratedMouseX, calibratedMouseY;
	var [diffX, diffY] = [0, 0];
	var isCalibrated = false;
    const canvas = document.getElementById('plane');
    const wireframe = new WireFrame(canvas, perspective);
	
	//////////////////////////////////////////////////////////////////////////////////////
	const key_map = {
		'w': {active: false, callback: () => vel = -40},
		's': {active: false, callback: () => vel = 40},
		'a': {active: false, callback: () => shiftSide = 40},
		'd': {active: false, callback: () => shiftSide = -40},
		'q': {active: false, callback: () => roll = -Math.PI/90},
		'e': {active: false, callback: () => roll = Math.PI/90},
		'ArrowUp': {active: false, callback: () => pitch = -Math.PI/90},
		'ArrowDown': {active: false, callback: () => pitch = Math.PI/90},
		'ArrowLeft': {active: false, callback: () => yaw = Math.PI/90},
		'ArrowRight': {active: false, callback: () => yaw = -Math.PI/90},
	};
	
	window.addEventListener('keydown', (event) => {
		if (key_map[event.key]) key_map[event.key].active = true;
	});
	
	window.addEventListener('keyup', (event) => {
		if (key_map[event.key]) key_map[event.key].active = false;
	});
	canvas.addEventListener('click', event => {
		if (! isCalibrated){
			console.log("Calibrated mouse control");
			isCalibrated = true;
			calibratedMouseX = event.clientX;
			calibratedMouseY = event.clientY;
		}
		else {
			isCalibrated = false;
			console.log("Disabled mouse control");
			diffX = 0;
			diffY = 0;
		}
		
	});
	
	window.addEventListener('mousemove', (event) => {
		if (isCalibrated) {
			let currMouseX = event.clientX;
			let currMouseY = event.clientY;
			diffX = calibratedMouseX - currMouseX;
			diffY = calibratedMouseY - currMouseY;
		}
		
	});
	
	function register_new_values(){
		yaw = diffX/canvas.width * Math.PI/30;  // mouse control
		pitch = -diffY/canvas.height * Math.PI/30;	
		Object.values(key_map).forEach(key => {
            if (key.active) key.callback();
        });
	}
	/////////////////////////////////////////////////////////////////////////////////////////
	function prepare_cubes(wireframe, number, world_size){
		wireframe.shapes = [];
		for(let i=0; i<number; i++){
			let start = { // Math.random() gives value from range (0,1) so it's needed to tweak it to give value from (-world_size,+world_size) 
				x: ((Math.random() - 0.5) * 2) * world_size.x, 
				y: ((Math.random() - 0.5) * 2) * world_size.y,
				z: ((Math.random() - 0.5) * 2) * world_size.z
			};
			
			let [dx, dy, dz] = [100 + Math.random()*300, 100 + Math.random()*300, 100 + Math.random()*300,];
			let shape = new Shape(start, dx, dy, dz, 'blue');
			wireframe.add_shape(shape);
			if(distance(shape.center(), {x:0, y:0, z: -perspective}) < shape.radius()){  // prevent from spawning inside a shape
				shape.vertices.forEach(point =>{
					point.x += 100;
				});
			}
		}	
		let target_id = Math.floor(Math.random() * (number + 1)); // random shape is designated to be the new target

		let target_shape = wireframe.shapes[target_id];
		target_shape.style = 'red';
		let border = new Shape({x: -world_size.x, y: -world_size.y, z: -world_size.z}, 2*world_size.x, 2*world_size.y, 2*world_size.z, 'black');
		wireframe.add_shape(border);
		return target_shape;
	}
	
	var target = prepare_cubes(wireframe, num_shapes, world_size);
	let i = 0;
	function render_function() {
		[vel, shiftSide, roll, yaw, pitch] = [0, 0, 0, 0, 0];
		register_new_values();
		wireframe.move(vel);
		wireframe.shift_side(shiftSide);
		wireframe.rotate(pitch, yaw, roll);
		wireframe.render();
		for(let i=0; i < wireframe.shapes.length-1; i++){ // last shape is the world border itself
			let shape = wireframe.shapes[i];
			 // camera is facing negative z axis, so to convert to world space its needed to subtract the perspective distance
			if(distance(shape.center(), {x:0, y:0, z: -perspective}) < shape.radius()){
				if (shape === target){
					target = prepare_cubes(wireframe, num_shapes, world_size);  // if target got hit, then reset map
					break;
				}
				else{
					wireframe.move(-vel);  // else prevent from moving further
				}
			}
		}
        window.requestAnimationFrame(render_function);  // prepare next frame
	};
	window.requestAnimationFrame(render_function);
});


function distance(a, b){
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}


window.addEventListener("keydown", function(e) {  // prevent page from scrolling up and down when using arrow keys
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

///////////////////////////////////////////////////////////////////////////////////////////////////
class WireFrame {
	constructor(canvas, perspective){
		this.ctx = canvas.getContext('2d');
		this.ctx.lineWidth = '1';
        this.height = canvas.height;
        this.width = canvas.width;
        this.shapes = [];
        this.perspective = perspective;  // distance from canvas plane to camera eye in world space 
	}
	add_shape(shape) {
        this.shapes.push(shape);
    }
	
	move(val) {  
        this.shapes.forEach(shape => {
				shape.vertices.forEach(point =>{
					point.z += val;  // since camera is fixed, and facing along negative z axis, only points are moved
				});			
        });
    }
	shift_side(val) {
		this.shapes.forEach(shape => {
				shape.vertices.forEach(point =>{
					point.x += val;  
				});			
        });
	}
	
	get_rotation_matrix(pitch, yaw, roll){
		/*
				|cosA -sinA  0|
		  R_z = |sinA  cosA  0|	 roll
				|0     0     1|
				
				|cosB  0  sinB|
		  R_y = |0     1     0|	 yaw
				|-sinB 0  cosB|
				
				|1     0     0|
		  R_x = |0  cosC -sinC|	 pitch
				|0  sinC  cosC|
				
		  R = R_z(A)*R_y(B)*R_x(C)
		*/
		let cosA = Math.cos(roll);
		let sinA = Math.sin(roll);
		let cosB = Math.cos(yaw);
		let sinB = Math.sin(yaw);
		let cosC = Math.cos(pitch);
		let sinC = Math.sin(pitch);
		
		// R = [r_ij]
		let r00 = cosA * cosB;
		let r01 = cosA * sinB * sinC - sinA * cosC;
		let r02 = cosA * sinB * cosC + sinA * sinC;
		let r10 = sinA * cosB;
		let r11 = sinA * sinB * sinC + cosA * cosC;
		let r12 = sinA * sinB * cosC - cosA * sinC;
		let r20 = -sinB;
		let r21 = cosB * sinC;
		let r22 = cosB * cosC;
		
		return [
		[r00, r01, r02],
		[r10, r11, r12],
		[r20, r21, r22]
		];
	}
	rotate(pitch, yaw, roll) { // performs rotation of points in space while having camera fixed
        let matrix = this.get_rotation_matrix(pitch, yaw, roll);
        this.shapes.forEach(shape => {
			shape.vertices.forEach(point =>{
				// when converting from world space coords to camera space coords it is necessary to shift perpsective on z axis
				let x = point.x, y = point.y, z = point.z + this.perspective; 
				point.x = matrix[0][0]*x + matrix[0][1]*y + matrix[0][2]*z;
				point.y = matrix[1][0]*x + matrix[1][1]*y + matrix[1][2]*z;
				point.z = matrix[2][0]*x + matrix[2][1]*y + matrix[2][2]*z - this.perspective;
			});				
        });
    }
	
	render(){
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.shapes.forEach(shape => {
			this.ctx.strokeStyle = shape.style;
			this.ctx.beginPath();
			shape.edges().forEach(edge =>{
				if (edge[0].z >= -this.perspective || edge[1].z >= -this.perspective) { // ingore lines that are behind camera
					// calculate intersection points with canvas plane of lines that span from given point in world space to the camera eye point
					let x0 = this.perspective * edge[0].x / Math.max(this.perspective + edge[0].z, 0.01) + this.width/2; 
					let y0 = this.perspective * edge[0].y / Math.max(this.perspective + edge[0].z, 0.01) + this.height/2;
					this.ctx.moveTo(x0, y0);
					let x1 = this.perspective * edge[1].x / Math.max(this.perspective + edge[1].z, 0.01) + this.width/2;
					let y1 = this.perspective * edge[1].y / Math.max(this.perspective + edge[1].z, 0.01) + this.height/2;
					this.ctx.lineTo(x1,y1);
					this.ctx.stroke();
				}
			});
			this.ctx.closePath();
		});
	}
}

class Shape {
	constructor(p0, dx, dy, dz, style){
		this.style = style;
		let p1 = {
			x: p0.x + dx, 
			y: p0.y, 
			z: p0.z
			};
		let p2 = {
			x: p0.x, 
			y: p0.y + dy, 
			z: p0.z
			};
		let p3 = {
			x: p0.x + dx, 
			y: p0.y + dy, 
			z: p0.z
			};		
		let p4 = {
			x: p0.x, 
			y: p0.y, 
			z: p0.z + dz
			};
		let p5 = {
			x: p1.x, 
			y: p1.y, 
			z: p1.z + dz
			};
		let p6 = {
			x: p2.x, 
			y: p2.y, 
			z: p2.z + dz
			};
		let p7 = {
			x: p3.x, 
			y: p3.y, 
			z: p3.z + dz
			};
		this.vertices = [p0, p1, p2, p3, p4, p5, p6, p7];
	}
	center(){
			return {
			x: (this.vertices[0].x + (this.vertices[7].x - this.vertices[0].x)/2),
			y: (this.vertices[0].y + (this.vertices[7].y - this.vertices[0].y)/2),
			z: (this.vertices[0].z + (this.vertices[7].z - this.vertices[0].z)/2),
			};
		}
	radius(){
		return distance(this.vertices[0], this.vertices[7])/2;
	}	
	edges(){
		return [
			[this.vertices[0], this.vertices[1]],
			[this.vertices[0], this.vertices[2]],
			[this.vertices[0], this.vertices[4]],
			[this.vertices[1], this.vertices[3]],
			[this.vertices[1], this.vertices[5]],
			[this.vertices[2], this.vertices[3]],
			[this.vertices[2], this.vertices[6]],
			[this.vertices[3], this.vertices[7]],
			[this.vertices[4], this.vertices[5]],
			[this.vertices[4], this.vertices[6]],
			[this.vertices[5], this.vertices[7]],
			[this.vertices[6], this.vertices[7]]
		];		
	}
	
}