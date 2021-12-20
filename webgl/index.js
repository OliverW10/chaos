// in function to use top level await
async function main(){

// webgl stuff partly copied from here
// https://compile.fi/canvas-filled-three-ways-js-webassembly-and-webgl/

const backgroundCanvas = document.getElementById('bg');
const foregroundCanvas = document.getElementById('fg');
const height = backgroundCanvas.height;
const width = backgroundCanvas.width;

let mousePos = {x: 0, y: 0}
document.addEventListener("mousemove", e=>{
    mousePos.x = e.pageX - backgroundCanvas.offsetLeft; 
    mousePos.y = e.pageY - backgroundCanvas.offsetTop; 
})
let play = true;
document.addEventListener("keydown", e=>{
    console.log(e.key);
    if(e.key == " "){
        if(!play){
            stats.begin();
            window.requestAnimationFrame(render);
        }
        play = !play;
    }
});

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

gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexLocations),
    gl.STATIC_DRAW
);

const midx = width/2;
const midy = height/2;

const rad = width*0.2;
const allMass = 1000;
const angOffset = 0;

const planetsNum = 3;
const planets = []

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


const program = gl.createProgram();
const buildShader = async (type, sourceUrl) => {
    const response = await fetch(sourceUrl);
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

const stepsId = gl.getUniformLocation(program, 'steps');
const stepSizeId = gl.getUniformLocation(program, 'stepSize');

const dampingId = gl.getUniformLocation(program, 'damping');

console.log(ctx);

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

let sim_timestamp = 0;

let delta = 0;
let last_timestamp = 0;
const render = (timestamp) => {
    stats.begin();
    delta = timestamp-last_timestamp;
    if(play){
        sim_timestamp += delta;
    }
    last_timestamp = timestamp;
    const planets = generatePlanets(midx, midy, planetsNum, rad, sim_timestamp*0.0001);
    const planetsPosOnly = getPosArray(planets)

    const stepsNum = Math.round(sim_timestamp*0.005);
    // Update timestamp
    gl.uniform1f(timestampId, sim_timestamp*0.3);
    gl.uniform1f(widthId, width);
    gl.uniform1f(heightId, height);
    gl.uniform1i(planetsNumId, planetsNum);
    gl.uniform1fv(planetsId, planetsPosOnly);
    gl.uniform1i(stepsId, stepsNum);//Math.round((timestamp%10)*1000));
    gl.uniform1f(stepSizeId, 1);
    gl.uniform1f(dampingId, 0.997);
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

    ctx.clearRect(0, 0, width, height);
    let target = {pos:{x:mousePos.x, y:mousePos.y}, vel:{x:0, y:0}};
    for(let i = 0; i < stepsNum; i++){
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(target.pos.x, target.pos.y);
        step(target, planets, planets.length, 1, 0.997)
        ctx.lineTo(target.pos.x, target.pos.y);
        ctx.stroke();
    }
    // console.log(`start: x ${mousePos.x} y ${mousePos.y}  end: x ${target.pos.x} y ${target.pos.y}`);

    stats.end();
    if(play){
        window.requestAnimationFrame(render);
    }
};

window.requestAnimationFrame(render);
}

main();