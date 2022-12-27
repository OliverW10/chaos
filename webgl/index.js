// in function to use top level await
async function main(){

    var obj = {
        rotation: 0,
        drag: 1,
        sim_length: 500,
        step_size: 0.4,
        accel_limit: 0.0002,
        renderSize: 800,
        drawSize: 800,
    };

    var gui = new dat.gui.GUI();
    gui.add(obj, "rotation", 0, Math.PI*2)
    gui.add(obj, "drag", 0.98, 1.02)
    gui.add(obj, "sim_length", 0, 1000, 1)
    gui.add(obj, "accel_limit", 0, 0.01, 0.00001)
    gui.add(obj, "step_size", 0.05, 2, 0.05)
    const renderSizeController = gui.add(obj, "renderSize", 10, 2000, 1)
    gui.width = 500;


    const backgroundCanvas = document.getElementById('bg');
    function updateCanvases(renderSize, drawSize){
        backgroundCanvas.width = renderSize;
        backgroundCanvas.height = renderSize;
        
        backgroundCanvas.style.width = drawSize;
        backgroundCanvas.style.height = drawSize;
        
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    }
    renderSizeController.onChange(p=>updateCanvases(p, obj.drawSize))


    let view_x = 0
    let view_y = 0
    let zoom = 1.2
    let keys = {"a":false, "d":false, "s":false, "w":false, "e":false, "q":false}
    document.addEventListener("keydown", e=>{
        keys[e.key] = true
    });
    document.addEventListener("keyup", e=>{
        keys[e.key] = false
    })
    
    // webgl stuff partly copied from here
    // https://compile.fi/canvas-filled-three-ways-js-webassembly-and-webgl/
    const gl = backgroundCanvas.getContext('webgl');
    updateCanvases(obj.renderSize, obj.drawSize)
    const vertexCount = 6;
    const vertexLocations = [
        // X, Y
        -1.0, -1.0,
        1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
        1.0, -1.0,
        1.0,  1.0
    ];
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertexLocations),
        gl.STATIC_DRAW
    );
    
    const planetsNum = 4;
    
    function generatePlanets(midx, midy, num, rad, angOffset){
        let planets = []
        for(let i=0;i<num;i++){ // iterates the keys of array
            let ang = angOffset + Math.PI * 2 * i/num;
            const planet = {x:midx+Math.cos(ang)*rad, y:midy+Math.sin(ang)*rad};
            planets.push(planet);
        }
        return planets;
    }
    function getPosArray(planets){
        let planetsPoss = []
        for(let planet of planets){ // iterates the keys of array
            planetsPoss = planetsPoss.concat([planet.x, planet.y]);
        }
        return Float32Array.from(planetsPoss);
    }
    
    
    var myHeaders = new Headers();
    myHeaders.append('pragma', 'no-cache');
    myHeaders.append('cache-control', 'no-cache');
    var myInit = {
      method: 'GET',
      headers: myHeaders,
    };
    
    const program = gl.createProgram();
    const buildShader = async (type, sourceUrl) => {
        const response = await fetch(sourceUrl, myInit);
        const source = await response.text();
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
    
        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        console.log(compiled);
    
        if(!compiled){
            var compilationLog = gl.getShaderInfoLog(shader);
            console.log('Shader compiler log: ' + compilationLog);
        }
    
        gl.attachShader(program, shader);
        return shader;
    };
    
    const vertexShader = await buildShader(gl.VERTEX_SHADER, "./vertex.glsl");
    const fragmentShader = await buildShader(gl.FRAGMENT_SHADER, "./frag.glsl");
    
    gl.linkProgram(program);
    gl.useProgram(program);
    // Detach and delete shaders as they're no longer needed
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    // Add attribute pointer to our vertex locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    const fieldCount = vertexLocations.length / vertexCount;
    gl.vertexAttribPointer(
        positionLocation,
        fieldCount,
        gl.FLOAT,
        gl.FALSE,
        fieldCount * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    
    const uniformIds = []
    for(const name of ['width', 'height', 'planetsNum', 'planets', 'mass', 'steps', 'stepSize', 'damping', 'accLimit', 'x', 'y', 'scale']){
        uniformIds[name] = gl.getUniformLocation(program, name)
    }
    function setUniform(name, val, ext="f"){
        gl["uniform1"+ext](uniformIds[name], val);
    }

    var stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );
    
    let delta = 0;
    let last_timestamp = 0;
    const render = (timestamp) => {
        stats.begin();
        delta = timestamp-last_timestamp;
        last_timestamp = timestamp;
        if(keys.a)view_x-=delta*0.0002*zoom
        if(keys.d)view_x+=delta*0.0002*zoom
        if(keys.w)view_y+=delta*0.0002*zoom
        if(keys.s)view_y-=delta*0.0002*zoom
        if(keys.q)zoom*=1+(Math.sqrt(delta)/60)*0.15
        if(keys.e)zoom*=1-(Math.sqrt(delta)/60)*0.15
        const planets = generatePlanets(0, 0, planetsNum, 0.3, obj.rotation);
        const planetsPosOnly = getPosArray(planets)
        
        setUniform('width', obj.renderSize)
        setUniform('height', obj.renderSize)
        setUniform('planetsNum', planetsNum, 'i')
        setUniform('planets', planetsPosOnly, "fv");
        setUniform('mass', 50*obj.renderSize**2);
        setUniform('steps', obj.sim_length/obj.step_size, "i");
        setUniform('stepSize', obj.step_size);
        setUniform('damping', obj.drag);
        setUniform('accLimit', obj.accel_limit);
        setUniform('x', view_x);
        setUniform('y', view_y);
        setUniform('scale', zoom);
    
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    
        stats.end();
        window.requestAnimationFrame(render);
    } // render
    
    window.requestAnimationFrame(render);
    } // main
    
    main();