function magnitude(vec){
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y);
}

function distanceSqr(p1, p2){
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx*dx + dy*dy;
}

function distance(p1, p2){
    return Math.sqrt(distanceSqr(p1, p2));
}
let G = 0.1;
function calcAccel(pos, other, m2){
    dx = (other.x-pos.x); // x and y distances
    dy = (other.y-pos.y);
    distS = dx*dx + dy*dy; // dist squared
    dist = Math.sqrt(distS);
    mag = 0.5*G*m2/distS; // magnitude of change
    ret = {x: 0, y: 0}
    // normalize dx and dy and multiply by magnitude
    return {x: mag*dx/dist, y: mag*dy/dist}
}

function calcAccels(pos, attractors, nattractors){
    let total = {x:0, y:0};
    for(let i = 0; i < nattractors; i++){
        const ret = calcAccel(pos, attractors[i].pos, attractors[i].mass);
        total.x += ret.x;
        total.y += ret.y;
    }
    return total;
}

function step(target, attractors, nattractors, t, damping){
    // adds targets velocity times the delta time to its pos ( ut )
    target.pos.x += target.vel.x * t * damping;
    target.pos.y += target.vel.y * t * damping;

    // gets a
    const accel = calcAccels(target.pos, attractors, nattractors);

    // calculates acceleration from "center force"
    // 
    
    // clamps acceleration, beacuse the acceleration is inverse to r^2
    // when r (distance) nears 0 the acceleration gets very big beacuse its a hyperbola
    accel.x = Math.max(-0.5, Math.min(0.5, accel.x));
    accel.y = Math.max(-0.5, Math.min(0.5, accel.y));

    // adds accel to velocity
    target.vel.x += accel.x*t;
    target.vel.y += accel.y*t;

    // dampens velocity
    target.vel.x *= Math.pow(damping, t);
    target.vel.y *= Math.pow(damping, t);

    // adds velocity to position
    target.pos.x += target.vel.x * t;
    target.pos.y += target.vel.y * t;
}

function closest(pos, bodies, nbodies){
    let cur = -1; // current closest
    let cur_dist = 999999; // will return -1 if all bodies are further than this
    for(let i = 0; i < nbodies; i++){
        const dist = distanceSqr(bodies[i].pos, pos);
        if(dist < cur_dist){
            cur = i;
            cur_dist = dist;
        }
    }
    return cur;
}