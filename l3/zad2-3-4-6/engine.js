class DrawingEngine {
	constructor(gl, useStencil){
		this.gl = gl;
		// Get the strings for our GLSL shaders
		var vertexShaderSource = document.querySelector("#vertex-shader-3d").text;
		var fragmentShaderSource = document.querySelector("#fragment-shader-3d").text;

		var stencilVertexShaderSource = document.querySelector("#stencil-vertex-shader").text;
		var stencilFragmentShaderSource = document.querySelector("#stencil-fragment-shader").text;
	
		// create GLSL shaders, upload the GLSL source, compile the shaders
		var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	
		var stencilVertexShader = createShader(gl, gl.VERTEX_SHADER, stencilVertexShaderSource);
		var stencilFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, stencilFragmentShaderSource);
		
		this.stencilProgram = createProgram(gl, stencilVertexShader, stencilFragmentShader);
		this.program = createProgram(gl, vertexShader, fragmentShader);
		this.gl.useProgram(this.program);
		this.drawTriangles = false;
		this.useStencil = useStencil;
		this.color = randColor(); // [0.2, 1, 0.2, 1];
		
		this.uniforms = {
			matrices: {
				worldView: this.gl.getUniformLocation(this.program, "u_worldView"),
				projection: this.gl.getUniformLocation(this.program, "u_projection"),
				world: this.gl.getUniformLocation(this.program, "u_world"),	
			},
			vectors :{
				lightDirection: this.gl.getUniformLocation(this.program, "u_lightDirection"),
				color: this.gl.getUniformLocation(this.program, "u_color")			
			},
			floats :{
				fogNear: this.gl.getUniformLocation(this.program, "u_fogNear"),
				fogFar: this.gl.getUniformLocation(this.program, "u_fogFar"),
											
			},
			booleans : {
				drawPoints: this.gl.getUniformLocation(this.program, "u_drawPoints"),
			}	
			
		};
		this.attributes = {
			position: this.gl.getAttribLocation(this.program, "a_position"),
			normals: this.gl.getAttribLocation(this.program, "a_normal"),
		};

		this.buffers = {};
					
		this.pointsLength = null;
		
		if(useStencil) this.prepareStencil();
						
	}

	mask(mask){
		this.gl.colorMask(mask[0], mask[1], mask[2], true)
	}


	bufferGraph(graph, drawTriangles){
		this.pointsLength = graph.points.length/3;
		this.buffers.positionBuffer = this.getBuffer(graph.points);
		this.drawTriangles = drawTriangles;
        if (drawTriangles) {
            this.buffers.normalBuffer = this.getBuffer(graph.normals);
        }
	}
	
	getBuffer(data){
		const buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
		return buffer;	
	}

	setUniforms(viewMatrix, worldMatrix){
		// get projection
		let fov = Math.PI/3;
	    let aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
	    let zNear = 1;
	    let zFar = 2000;
	    let projectionMatrix = m4.perspective(fov, aspect, zNear, zFar);

	    // set uniforms
	    this.gl.uniform1f(this.uniforms.floats.fogNear, 1000.0);
        this.gl.uniform1f(this.uniforms.floats.fogFar, 1500.0);

        this.gl.uniform1f(this.uniforms.booleans.drawPoints, this.drawTriangles ? 0.0 : 1.0,);

        this.gl.uniformMatrix4fv(this.uniforms.matrices.projection, false, projectionMatrix);
          
        this.gl.uniformMatrix4fv(this.uniforms.matrices.world, false, worldMatrix);

        let worldViewMatrix = m4.multiply(viewMatrix, worldMatrix);
        this.gl.uniformMatrix4fv(this.uniforms.matrices.worldView, false, worldViewMatrix);

        this.gl.uniform4fv(this.uniforms.vectors.color, this.color);
        this.gl.uniform3fv(this.uniforms.vectors.lightDirection, m4.normalize([0.5, 0.7, 1]));


        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.positionBuffer);
        this.gl.vertexAttribPointer(
            this.attributes.position,
            3,
            this.gl.FLOAT,
            false,
            0,
            0
        );

        if (this.drawTriangles) {
            this.gl.enableVertexAttribArray(this.attributes.normals);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normalBuffer);
            this.gl.vertexAttribPointer(
                this.attributes.normals,
                3,
                this.gl.FLOAT,
                false,
                0,
                0
            );
        }
	}

	prepareStencil(){
		this.gl.useProgram(this.stencilProgram);
		this.buffers.stencilBuffer = this.getBuffer(
			[ -1, -1, 
			-1,  1, 
			1,  1,
			1, -1]);
		this.attributes.stencilPosition = this.gl.getAttribLocation(this.stencilProgram, "aPosition");
	}

	drawStencil(){ // draws checkerboard pixel pattern on canvas
		resizeCanvas(this.gl.canvas);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.useProgram( this.stencilProgram );

		this.gl.disable(this.gl.DEPTH_TEST);
    	this.gl.clearColor(0.5, 0.5, 0.5, 1.0);
    	this.gl.clearStencil(0);
    	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT );
    	

		this.gl.stencilOp(this.gl.REPLACE, this.gl.REPLACE, this.gl.REPLACE );
		this.gl.stencilMask(255); // enable modification of stencil buffer
		this.gl.depthMask(false);   
		this.gl.stencilFunc(this.gl.ALWAYS, 1, 255);


    	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.stencilBuffer ); /* refer to the buffer */

    	this.gl.vertexAttribPointer(
    		this.attributes.stencilPosition, 
    		2, 
    		this.gl.FLOAT, 
    		false, 
    		0, 
    		0
    	);
    	this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
	}

	draw(cameraMatrix, xRot, yRot, zRot, drawTwoPlanes, drawAnaglyph){
		resizeCanvas(this.gl.canvas);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.useProgram(this.program);
		this.gl.enable(this.gl.DEPTH_TEST);   	
    	this.gl.depthFunc(this.gl.LESS);
    	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		let viewMatrix = m4.inverse(cameraMatrix);

		if (drawTwoPlanes){
			if(this.useStencil){
				this.drawStencil();
				this.gl.useProgram( this.program );
				this.gl.enable(this.gl.DEPTH_TEST);   
				this.gl.enable(this.gl.STENCIL_TEST);
				this.gl.depthFunc(this.gl.LESS);
				// draw through reference pixels 1
		    	this.gl.stencilFunc(this.gl.EQUAL, 1, 255); 
		    	this.gl.stencilMask(0); // disable modification of stencil buffer*/
		    	this.gl.depthMask(true);   
		    	
			}
			let worldMatrix = m4.identity();
	        worldMatrix = m4.xRotate(worldMatrix, xRot);
	        worldMatrix = m4.yRotate(worldMatrix, yRot);
	        worldMatrix = m4.zRotate(worldMatrix, zRot);
	        worldMatrix = m4.translate(worldMatrix, -250, -220, 0);

			this.setUniforms(viewMatrix, worldMatrix);
	        this.gl.drawArrays(
	            this.drawTriangles ? this.gl.TRIANGLES : this.gl.POINTS,
	            0,
	            this.pointsLength
	        );
	        // draw second graph
	        if (this.useStencil) {
	        	// draw through reference pixels 0
	        	this.gl.stencilFunc(this.gl.EQUAL, 0, 255); 
    			this.gl.stencilMask(0); // disable modification of stencil buffer
    			this.gl.depthMask(true);   
	        }
	        worldMatrix = m4.identity();
	        worldMatrix = m4.xRotate(worldMatrix, xRot);
	        worldMatrix = m4.yRotate(worldMatrix, yRot);
	        worldMatrix = m4.zRotate(worldMatrix, -zRot);
	        worldMatrix = m4.translate(worldMatrix, -150, -220, 0);

	    	this.setUniforms(viewMatrix, worldMatrix);
	    	this.gl.drawArrays(
	            this.drawTriangles ? this.gl.TRIANGLES : this.gl.POINTS,
	            0,
	            this.pointsLength
	        );
		}
		else if(drawAnaglyph) {
			if(this.useStencil){
				this.drawStencil();
				this.gl.enable(this.gl.DEPTH_TEST);   
				this.gl.enable(this.gl.STENCIL_TEST);
				this.gl.depthFunc(this.gl.LESS);
				// draw through reference pixels 1
		    	this.gl.stencilFunc(this.gl.EQUAL, 1, 255); 
		    	this.gl.stencilMask(0); // disable modification of stencil buffer*/
		    	this.gl.depthMask(true);   
		    	this.gl.useProgram( this.program );
			}
			let worldMatrix = m4.identity();
	        worldMatrix = m4.xRotate(worldMatrix, xRot);
	        worldMatrix = m4.yRotate(worldMatrix, yRot);
	        worldMatrix = m4.zRotate(worldMatrix, zRot);
	        worldMatrix = m4.translate(worldMatrix, -250, -220, 0);
	         this.mask([true, false, false]);     
			this.setUniforms(viewMatrix, worldMatrix);
	        this.gl.drawArrays(
	            this.drawTriangles ? this.gl.TRIANGLES : this.gl.POINTS,
	            0,
	            this.pointsLength
	        );
	        // draw second image 
	        if (this.useStencil) {
	        	// draw through reference pixels 0
	        	this.gl.stencilFunc(this.gl.EQUAL, 0, 255); 
    			this.gl.stencilMask(0); // disable modification of stencil buffer
    			this.gl.depthMask(true);   
	        }

	        let snapshotCameraMatrix = m4.yRotate(cameraMatrix, radians(2)); // slightly rotate camera to take snapshot of right eye
            viewMatrix = m4.inverse(snapshotCameraMatrix);
            this.mask([false, true, true]);        

	    	this.setUniforms(viewMatrix, worldMatrix);
	    	this.gl.drawArrays(
	            this.drawTriangles ? this.gl.TRIANGLES : this.gl.POINTS,
	            0,
	            this.pointsLength
	        );
	        this.mask([true, true, true]);
		}
		else{
			if(this.useStencil){
				this.drawStencil();
				this.gl.useProgram( this.program );
				this.gl.enable(this.gl.DEPTH_TEST);   
				this.gl.enable(this.gl.STENCIL_TEST);
				this.gl.depthFunc(this.gl.LESS);
				// draw through reference pixels 1
		    	this.gl.stencilFunc(this.gl.EQUAL, 1, 255); 
		    	this.gl.stencilMask(0); // disable modification of stencil buffer*/
		    	this.gl.depthMask(true); 
			}
			let worldMatrix = m4.identity();
	        worldMatrix = m4.xRotate(worldMatrix, xRot);
	        worldMatrix = m4.yRotate(worldMatrix, yRot);
	        worldMatrix = m4.zRotate(worldMatrix, zRot);
	        worldMatrix = m4.translate(worldMatrix, -250, -220, 0);    
			this.setUniforms(viewMatrix, worldMatrix);
	        this.gl.drawArrays(
	            this.drawTriangles ? this.gl.TRIANGLES : this.gl.POINTS,
	            0,
	            this.pointsLength
	        );
		}

	}
}
function radians(deg){
    return deg*Math.PI/180;
}

function resizeCanvas(canvasElement) {
    let displayWidth = canvasElement.clientWidth;
    let displayHeight = canvasElement.clientHeight;

        if (canvasElement.width !== displayWidth || canvasElement.height !== displayHeight) { // if dimensions changed
            canvasElement.width = displayWidth;
            canvasElement.height = displayHeight;
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
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}