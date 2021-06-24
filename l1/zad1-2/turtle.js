// Krzysztof Szymaniak 250136

window.addEventListener('load', () => {
    const plane = document.getElementById("plane");
    const command_input = document.getElementById("command_input");
    const run_button = document.getElementById("run_button");
    const turtle = new Turtle(plane);
    const koch_button = document.getElementById("run_koch");
	const sierp_button = document.getElementById("run_sierp");
	const poly_button = document.getElementById("poly_button");
	const COLORS = ['black', 'blue', 'red', 'green', 'yellow', 'purple', 'gray'];
	
	updateCoords(turtle.x, turtle.y, turtle.rotation);
    
    function run(){
        turtle.parse(command_input.value);
        updateCoords(turtle.x, turtle.y, turtle.rotation);
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
				turtle.rotate(120);
			}
		}
		else{
			length /= 2.0;
			sierp(length, degree-1);
			turtle.move(length);
			sierp(length, degree-1);
			turtle.move(-length);
			turtle.rotate(60);
			turtle.move(length);
			turtle.rotate(-60);
			sierp(length, degree-1);
			turtle.rotate(60);
			turtle.move(-length);
			turtle.rotate(-60);     
		}
	}
	
	sierp_button.addEventListener('click', () => {
		const ctx = plane.getContext('2d');
		let degree = document.getElementById('degree_input').value;
		let size = document.getElementById('size').value;
		sierp(size, degree);
	});
	
	function koch(length, degree){
		if (degree == 0){
			turtle.move(length);
			return;
		}
		length /= 3.0;
		koch(length, degree-1);
		turtle.rotate(60);
		koch(length, degree-1);
		turtle.rotate(-120);
		koch(length, degree-1);
		turtle.rotate(60);
		koch(length, degree-1);		
	}
	
	koch_button.addEventListener('click', () => {
		const ctx = plane.getContext('2d');
		let degree = document.getElementById('degree_input').value;
		let size = document.getElementById('size').value;
		for (let i = 0; i < 3; i++){
			koch(size, degree);
			turtle.rotate(-120);  
		}
		updateCoords(turtle.x, turtle.y, turtle.rotation);
	});
	
	poly_button.addEventListener('click', () => {
		const ctx = plane.getContext('2d');
		let col = document.getElementById('color').value;
		ctx.strokeStyle = COLORS[col];
		let n = document.getElementById('sides').value;
		let length = parseFloat(document.getElementById('length').value);
		
		for(let i = 0; i<n; i++){
			turtle.move(length);
			turtle.rotate(360/n);
		}
		document.getElementById('poly_info').textContent = `N: ${n} Color: ${COLORS[col]}`;
		ctx.strokeStyle = 'blue';
		updateCoords(turtle.x, turtle.y, turtle.rotation);
	});
	
});

function updateCoords(x, y, r){
	let info = document.getElementById("coords");
    info.textContent = `X: ${Math.round(x)} Y: ${Math.round(y)} R: ${Math.round(r)}`;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Turtle{
	constructor(plane){
		this.ctx = plane.getContext("2d");
		this.height = plane.height;
		this.width = plane.width;
        this.ctx.lineWidth = '1';
        this.ctx.strokeStyle = 'blue';
		this.minX = -450;  // window boundaries
		this.maxX = 450;
		this.minY = -300;
		this.maxY = 300;
        this.x = 0;  // coordinates of turtle
        this.y = 0;
		
		//x_px, y_px are the coordinates on canvas
		this.x_px = this.transform(this.x, this.minX, this.maxX, 0, this.width);
		this.y_px = this.height - this.transform(this.y, this.minY, this.maxY, 0, this.height); // transforms to canvas rectangle and makes it flip downwards
        this.rotation = 90;
        this.isPenDown = true;
	}
	
	rotate(angle) {
		angle = parseFloat(angle);
		if (isNaN(angle))
			return;
        this.rotation = (this.rotation + angle) % 360;
		if (this.rotation < 0){
			this.rotation += 360;
		}
    }
	
	transform(p, src_min, src_max, tgt_min, tgt_max){ // transform a coordinate from one rectangle to another
		return tgt_min + (p - src_min) * (tgt_max - tgt_min) / (src_max - src_min);
	}
	
	move(value){
		value = parseFloat(value);
		if (isNaN(value))
			return;
		this.ctx.beginPath();
        this.ctx.moveTo(this.x_px, this.y_px);
        this.x += value * Math.cos(this.rotation * Math.PI/180);
        this.y += value * Math.sin(this.rotation * Math.PI/180);
		this.x_px = this.transform(this.x, this.minX, this.maxX, 0, this.width);
		this.y_px = this.height - this.transform(this.y, this.minY, this.maxY, 0, this.height);  // tranforms to canvas rectangle and makes it flip downwards
        this.ctx.lineTo(this.x_px, this.y_px);
        if (this.isPenDown) this.ctx.stroke();
		this.ctx.closePath();
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
				let [command, ...params] = command_list[c].replace(/\s+/g, ' ').trim().split(' ');  // triple dot represents optional bonus parameters
				this.execute(command, ...params);
			}      
		}  
    }
	
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
                this.rotate(-params[0]);
                break;
            }
            case "lt": {
                this.rotate(params[0]);
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