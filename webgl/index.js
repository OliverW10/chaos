// in function to use top level await
async function main(){

var obj = {
    radius: 0.2,
    rotation: 0,
    drag: 0.999,
    length: 100,
    step_size: 0.4,
    accel_limit: 0.0002,
    renderSize: 400,
    drawSize: 800,
};

var gui = new dat.gui.GUI();

gui.remember(obj);

gui.add(obj, 'radius', 0, 1)
gui.add(obj, 'rotation', 0, Math.PI*2)
gui.add(obj, 'drag', 0.98, 1, 0.001)
gui.add(obj, "length", 0, 1000, 1)
gui.add(obj, "accel_limit", 0, 0.01, 0.00001)
gui.add(obj, "step_size", 0.05, 2, 0.05)
const renderSizeController = gui.add(obj, "renderSize", 10, 2000, 1)

// webgl stuff partly copied from here
// https://compile.fi/canvas-filled-three-ways-js-webassembly-and-webgl/

const backgroundCanvas = document.getElementById('bg');
const foregroundCanvas = document.getElementById('fg');
function updateCanvases(renderSize, drawSize){
    backgroundCanvas.width = renderSize;
    backgroundCanvas.height = renderSize;
    foregroundCanvas.width = renderSize;
    foregroundCanvas.height = renderSize;

    backgroundCanvas.style.width = drawSize;
    backgroundCanvas.style.height = drawSize;
    foregroundCanvas.style.width = drawSize;
    foregroundCanvas.style.height = drawSize;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
}

renderSizeController.onChange(p=>updateCanvases(p, obj.drawSize))
gui.width = 500;


let mousePos = {x: 0, y: 0}
document.addEventListener("mousemove", e=>{
    mousePos.x = e.pageX - backgroundCanvas.offsetLeft; 
    mousePos.y = e.pageY - backgroundCanvas.offsetTop; 
})
let play = true;
let doGrav = false;
let x = 0
let y = 0
let s = 1
let keys = {"a":false, "d":false, "s":false, "w":false, "e":false, "q":false}
document.addEventListener("keydown", e=>{
    if(e.key == " "){
        if(!play){
            stats.begin();
            window.requestAnimationFrame(render);
        }
        play = !play;
    }
    if(e.key == "g"){
        doGrav = !doGrav;
        console.log(`grav: ${doGrav}`);
    }
    keys[e.key] = true
});
document.addEventListener("keyup", e=>{
    keys[e.key] = false
})

const ctx = foregroundCanvas.getContext("2d");

// Get webgl drawing context
const gl = backgroundCanvas.getContext('webgl');
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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
updateCanvases(obj.renderSize, obj.drawSize)

gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexLocations),
    gl.STATIC_DRAW
);

const allMass = 20000;

const planetsNum = 3;

function generatePlanets(midx, midy, num, rad, angOffset){
    let planets = []
    for(let i=0;i<num;i++){ // iterates the keys of array
        const planet = {}
        let ang = angOffset + Math.PI * 2 * i/num;
        planet.pos = {x:midx+Math.cos(ang)*rad, y:midy+Math.sin(ang)*rad};
        planet.mass = allMass;
        planets.push(planet);
    }
    return planets;
}
function getPosArray(planets){
    let planetsPoss = []
    for(let planet of planets){ // iterates the keys of array
        planetsPoss = planetsPoss.concat([planet.pos.x, planet.pos.y]);
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

const timestampId = gl.getUniformLocation(program, 'timestamp');
const widthId = gl.getUniformLocation(program, 'width');
const heightId = gl.getUniformLocation(program, 'height');

const planetsNumId = gl.getUniformLocation(program, "planetsNum")
const planetsId = gl.getUniformLocation(program, 'planets');
const planetsMassId = gl.getUniformLocation(program, 'm');

const stepsId = gl.getUniformLocation(program, 'steps');
const stepSizeId = gl.getUniformLocation(program, 'stepSize');

const dampingId = gl.getUniformLocation(program, 'damping');
const doGravId = gl.getUniformLocation(program, 'doGrav');

const accelLimitId = gl.getUniformLocation(program, "accLimit");

const xId = gl.getUniformLocation(program, 'x');
const yId = gl.getUniformLocation(program, 'y');
const sId = gl.getUniformLocation(program, 'scale');

console.log(ctx);

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

let sim_timestamp = 0;

let delta = 0;
let last_timestamp = 0;
const render = (timestamp) => {
    stats.begin();
    const midx = obj.renderSize/2;
    const midy = obj.renderSize/2;
    delta = timestamp-last_timestamp;
    if(play){
        sim_timestamp += delta;
    }
    if(keys.a)x-=delta*0.0005*s
    if(keys.d)x+=delta*0.0005*s
    if(keys.w)y+=delta*0.0005*s
    if(keys.s)y-=delta*0.0005*s
    if(keys.q)s*=1+(Math.sqrt(delta)/60)
    if(keys.e)s*=1-(Math.sqrt(delta)/60)
    last_timestamp = timestamp;
    const planets = generatePlanets(0, 0, planetsNum, 0.3, obj.rotation);
    const planetsPosOnly = getPosArray(planets)

    gl.uniform1f(timestampId, 0);
    gl.uniform1f(widthId, obj.renderSize);
    gl.uniform1f(heightId, obj.renderSize);
    gl.uniform1i(planetsNumId, planetsNum);
    gl.uniform1f(planetsMassId, 50*obj.renderSize**2);
    gl.uniform1fv(planetsId, planetsPosOnly);
    gl.uniform1i(stepsId, obj.length/obj.step_size);
    gl.uniform1f(stepSizeId, obj.step_size);
    gl.uniform1f(dampingId, obj.drag);
    gl.uniform1f(doGravId, doGrav?1.0:0.0);
    gl.uniform1f(accelLimitId, obj.accel_limit);
    gl.uniform1f(xId, x);
    gl.uniform1f(yId, y);
    gl.uniform1f(sId, s);
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

    // ctx.clearRect(0, 0, obj.renderSize, obj.renderSize);
    // let target = {pos:{x:mousePos.x, y:obj.renderSize-mousePos.y}, vel:{x:0, y:0}};
    // ctx.beginPath();
    // ctx.lineWidth = 1;
    // ctx.moveTo(target.pos.x, obj.renderSize-target.pos.y);
    // for(let i = 0; i < obj.length/obj.step_size; i++){
    //     step(target, planets, planets.length, obj.step_size, 0.999, 0.1)
    //     if(i%5 == 0){
    //         ctx.lineTo(target.pos.x, obj.renderSize-target.pos.y);
    //         ctx.stroke();

    //         ctx.beginPath();
    //         ctx.lineWidth = 1;
    //         ctx.moveTo(target.pos.x, obj.renderSize-target.pos.y);
    //     }
    // }
    // console.log(`start: x ${mousePos.x} y ${mousePos.y}  end: x ${target.pos.x} y ${target.pos.y}`);

    stats.end();
    if(play){
        window.requestAnimationFrame(render);
    }
} // render

window.requestAnimationFrame(render);
} // main

main();