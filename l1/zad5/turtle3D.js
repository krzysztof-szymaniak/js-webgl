// Krzysztof Szymaniak 250136

window.addEventListener('load', () => {
    const canvas = document.getElementById("plane");
    const command_input = document.getElementById("command_input");
    const run_button = document.getElementById("run_button");
	const koch_button = document.getElementById("run_koch");
	const sierp_button = document.getElementById("run_sierp");
	const poly_button = document.getElementById("poly_button");
	const degree_input = document.getElementById("degree_input");
	const sides_input = document.getElementById("sides_input");
    
	const perspective = 500;
	const wireframe = new WireFrame(canvas, perspective);
	const turtle = new Turtle3D(wireframe);
	
	window.addEventListener("keydown", function(e) {  // prevent page from scrolling up and down when using arrow keys
		if(["ArrowUp","ArrowDown"].indexOf(e.code) > -1) {
        e.preventDefault();
		}
	}, false);
	//////////////////// drawing instructions
    function run(){	
        turtle.parse(command_input.value);
    }
	
	run_button.addEventListener('click', run);
    command_input.addEventListener('keyup', (event) => {
        event.preventDefault();
        if (event.key === 'Enter') {
            run();
        }
    });
	function sierp(length, degree){
		if (degree == 0){
			for (let i = 0; i < 3; i++){
				turtle.move(length);
				turtle.yaw(120);
			}
		}
		else{
			length /= 2.0;
			sierp(length, degree-1);
			turtle.move(length);
			sierp(length, degree-1);
			turtle.move(-length);
			turtle.yaw(60);
			turtle.move(length);
			turtle.yaw(-60);
			sierp(length, degree-1);
			turtle.yaw(60);
			turtle.move(-length);
			turtle.yaw(-60);     
		}
	}
	
	sierp_button.addEventListener('click', () => {
		let degree = degree_input.value;
		let size = document.getElementById('size').value;
		sierp(size, degree);
	});
	
	koch_button.addEventListener('click', () => {
		let degree = degree_input.value;
		let size = document.getElementById('size').value;
		for (let i = 0; i < 3; i++){
			koch(size, degree);
			turtle.yaw(-120);  
		}
	});
	function koch(length, degree){
		if (degree == 0){
			turtle.move(length);
			return;
		}
		length /= 3.0;
		koch(length, degree-1);
		turtle.yaw(60);
		koch(length, degree-1);
		turtle.yaw(-120);
		koch(length, degree-1);
		turtle.yaw(60);
		koch(length, degree-1);		
	}
	
	poly_button.addEventListener('click', () => {
		let n = sides_input.value;
		let length = parseFloat(document.getElementById('length').value);
		
		for(let i = 0; i<n; i++){
			turtle.move(length);
			turtle.yaw(360/n);
		}
		document.getElementById('poly_info').textContent = `N: ${n}`;
	});
	
	///////////////////////////// mechanics
	var vel, shiftSide, pitch, yaw, roll;
	var calibratedMouseX, calibratedMouseY;
	var [diffX, diffY] = [0, 0];
	var isCalibrated = false;
	
	const key_map = {
		'w': {active: false, callback: () => vel = -20},
		's': {active: false, callback: () => vel = 20},
		'a': {active: false, callback: () => shiftSide = 20},
		'd': {active: false, callback: () => shiftSide = -20},
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
		yaw = diffX/plane.width * Math.PI/30;  // mouse control
		pitch = -diffY/plane.height * Math.PI/30;	
		Object.values(key_map).forEach(key => {
            if (key.active) key.callback();
        });
	}
	function render_function() {
		[vel, shiftSide, roll, yaw, pitch] = [0, 0, 0, 0, 0];
		register_new_values();
		wireframe.move(vel, turtle);
		wireframe.shift_side(shiftSide, turtle);
		wireframe.rotate(pitch, yaw, roll, turtle);
		wireframe.render();
        window.requestAnimationFrame(render_function);  // prepare next frame
	};
	window.requestAnimationFrame(render_function);	
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Turtle3D{
	constructor(wireframe){
		this.wireframe = wireframe;
        this.yaw_angle = 0;
		this.pitch_angle = 0;		
		this.x = 100;
		this.y = 100;
		this.z = 100;
        this.isPenDown = true;
	}
	
	yaw(angle) {
		let angle_p = parseFloat(angle);
		if (isNaN(angle_p))
			return;
        this.yaw_angle = (this.yaw_angle + angle_p) % 360;
		if (this.yaw_angle < 0){
			 this.yaw_angle += 360;
		}
    }
	pitch(angle) {
		let angle_p = parseFloat(angle);
		if (isNaN(angle_p))
			return;
        this.pitch_angle = (this.pitch_angle + angle_p) % 360;
		if (this.pitch_angle < 0){
			this.pitch_angle += 360;
		}
    }
	
	move(value){
		value = parseFloat(value);
		if (isNaN(value))
			return;
		
		const start = {x: this.x, y: this.y, z: this.z};
		let sinPitch = Math.sin(this.pitch_angle * Math.PI / 180);
		let cosPitch = Math.cos(this.pitch_angle * Math.PI / 180);	
		let sinYaw = Math.sin(this.yaw_angle * Math.PI / 180);
		let cosYaw = Math.cos(this.yaw_angle * Math.PI / 180); 

		// rotation matrix but for roll = 0;
		this.x += value * cosPitch * sinYaw;
		this.y += value * sinPitch;
		this.z += value * cosPitch * cosYaw;

		if (this.isPenDown) {			
			const end = {x: this.x, y: this.y, z: this.z};
			this.wireframe.add_shape(new Shape(start, end));
		}
	}
	
	parse(input_text){
		let occ = input_text.indexOf("repeat");
		if (occ != -1){  // handling 'repeat' command
			this.parse(input_text.substring(0, occ));  // parsing what is before repeat command
			let repeats = parseInt(input_text.substring(occ).trim().split(' ')[1]);
			let first = input_text.indexOf("[");
			let brackets = 0, i = first;
			for (; i < input_text.length; i++){
				if(input_text[i] == '[')
					brackets++;
				else if(input_text[i] == ']')
					brackets--;				
				if(brackets == 0)
					break;
			}
			let last = i;
			for(let i = 0; i < repeats; i++){
				this.parse(input_text.substring(first+1, last));
			}
			this.parse(input_text.substring(last+1));	// parsing what is left after repeat command		
		}
		else {  // regular commands
			const command_list = input_text.split(';');
			for(let c in command_list){
				let [command, ...params] = command_list[c].replace(/\s+/g, ' ').trim().split(' ');  // triple dot represents any number of arguments
				this.execute(command, ...params);
			}      
		}  
    }
  // repeat 4 [ fw 300; lt 90; ] ut 90; fw 300; dt 90; repeat 4 [ fw 300; dt 90; fw 300; bw 300; ut 90; lt 90; ]  
	execute(command, ...params){
		switch (command) {
            case "fw": {
                this.move(params[0]);
                break;
            }
            case "bw": {
                this.move(-params[0]);
                break;
            }
            case "rt": {
                this.yaw(params[0]);
                break;
            }
            case "lt": {
                this.yaw(-params[0]);
                break;
            }
			case "dt": {
                this.pitch(params[0]);
                break;
            }
			case "ut": {
                this.pitch(-params[0]);
                break;
            }
            case "up": {
                this.isPenDown = false;
                break;
            }
            case "down": {
                this.isPenDown = true;
                break;
            }
            
        }
	}
	
}
//////////////////////////////////////////////////////////////////////////////////////////////////
class WireFrame {
	constructor(canvas, perspective){
		this.ctx = canvas.getContext('2d');
		this.ctx.lineWidth = '4';
		this.ctx.strokeStyle = 'blue';
        this.height = canvas.height;
        this.width = canvas.width;
        this.shapes = [];
        this.perspective = perspective;  // distance from canvas plane to camera eye in world space
	}
	add_shape(shape) {
		this.shapes.push(shape);
    }
	
	move(val, turtle) {
		turtle.z += val;
        this.shapes.forEach(shape => {
				shape.vertices.forEach(point =>{
					point.z += val;  // since camera is fixed, and facing along negative z axis, only points are moved
				});			
        });
    }
	shift_side(val, turtle) {
		turtle.x += val;
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
	rotate(pitch, yaw, roll, turtle) { // performs rotation of points in space while having camera fixed
		turtle.yaw_angle += yaw * 180/Math.PI; // update turtle position as well, unfortunately I failed to implement updating pitch angle as well
		let matrix = this.get_rotation_matrix(pitch, yaw, roll);
		let x = turtle.x, y = turtle.y, z = turtle.z + this.perspective; 
		turtle.x = matrix[0][0]*x + matrix[0][1]*y + matrix[0][2]*z;
		turtle.y = matrix[1][0]*x + matrix[1][1]*y + matrix[1][2]*z;
		turtle.z = matrix[2][0]*x + matrix[2][1]*y + matrix[2][2]*z - this.perspective;
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

class Shape { // simple line
	constructor(a, b){
		this.vertices = [a, b];
	}
	edges(){
		return [[this.vertices[0], this.vertices[1]]];
	}
}