// Krzysztof Szymaniak 250136

window.addEventListener('load', () => {
	const koch_button = document.getElementById("run_koch");
	const sierp_button = document.getElementById("run_sierp");
	const svg = document.getElementById("svg");
	const input = document.getElementById("degree_input");
	const degree_label = document.getElementById("degree_label");
	const starters = [{x: 300, y:300}, {x: 600, y: 300}, {x: 450, y: 600 - 300 - (150)*Math.sqrt(3)}]; // starting points that form a tringle
	var type = 'koch'; // remeber last type of curve so it can be brought up during degree sliding
	degree_label.textContent = `Degree: ${input.value}`;
	
	sierp_button.addEventListener('click', run_sierp);
	
	function run_sierp(){
		svg.innerHTML = '';
		let degree = input.value;
		sierp(degree, starters[0], starters[1], starters[2]);
		type = 'sierp';
	}
	function run_koch(){
		svg.innerHTML = '';
		let degree = input.value;
		koch(degree, starters[0], starters[1]);
		koch(degree, starters[1], starters[2]);
		koch(degree, starters[2], starters[0]);
		type = 'koch';
	}
	
	koch_button.addEventListener('click', run_koch);
	
	input.addEventListener('input', () => {
		degree_label.textContent = `Degree: ${input.value}`;
		if (type === 'sierp'){
			run_sierp();
		}
		else{
			run_koch();
		}
	});
	
	function sierp(degree, A, B, C){
		points = `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${A.x},${A.y}`; // base triangle points
		svg.innerHTML += `<polyline points = "${points}" style="fill: none; stroke: black; stroke-width: 1px">`; // add new polyline
		if (degree > 0){
			// calcuate middle points on each side
			let P = {
				x: A.x/2 + B.x/2,
				y: A.y/2 + B.y/2
			};
			let Q = {
				x: A.x/2 + C.x/2,
				y: A.y/2 + C.y/2
			};
			let R = {
				x: B.x/2 + C.x/2,
				y: B.y/2 + C.y/2
			}; // draw 3 more triangles
			sierp(degree-1, A, P, Q);
			sierp(degree-1, B, P, R);
			sierp(degree-1, C, Q, R);
		}
		
	}
	
	function koch(degree, A, B){
		let v = { // vector from A -> B
			x: B.x - A.x, 
			y: B.y - A.y
		};
		// points form this kind of shape:
		//     Q
		// A-P/ \R-B 
		//
		let P = {
			x: A.x + v.x/3, 
			y: A.y + v.y/3
		};
						
		let R = {
			x: A.x + 2*v.x/3, 
			y: A.y + 2*v.y/3
		};
		let r = rotate_vec(P.x - R.x, P.y - R.y, -2*Math.PI/3);
		let Q = {
			x: P.x + r.x,
			y: P.y + r.y
		};
		
		if (degree == 1){
			points = `${A.x},${A.y} ${P.x},${P.y} ${Q.x},${Q.y} ${R.x},${R.y} ${B.x},${B.y}`;
			svg.innerHTML += `<polyline points = "${points}" style="fill: none; stroke: black; stroke-width: 1px">`; // add new polyline 
		}
		else{  // call koch on each of 4 new sections
			koch(degree - 1, A, P);
			koch(degree - 1, P, Q);
			koch(degree - 1, Q, R);
			koch(degree - 1, R, B);
		}
	}
	
	function rotate_vec(x, y, angle){
		let rx = x*Math.cos(angle) - y*Math.sin(angle);
		let ry = x*Math.sin(angle) + y*Math.cos(angle);
		return {x: rx, y: ry};
	}
});