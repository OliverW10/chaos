// Mobiles need this
precision highp float;

uniform float width;
uniform float height;

#define MAX_PLANETS 6
uniform int planetsNum;

uniform float planets[2*MAX_PLANETS];
uniform float mass; // mass of planets

#define MAX_STEPS 20000
uniform int steps;
uniform float stepSize;

uniform float damping;
uniform float accLimit;

uniform float x;
uniform float y;
uniform float scale;

#define g 0.00000000001 // strength of the center force
#define height 5000.0 // how much the center force scales with distance

vec2 getAcceleration(vec2 pos, vec2 planetPos){
    vec2 diff = planetPos.xy-pos.xy;
    float distSqr = diff.x*diff.x + diff.y*diff.y;
    float dist = sqrt(distSqr);
    float mag = mass/distSqr;
    return vec2(mag*diff.x/dist, mag*diff.y/dist);
}

int findClosest(vec2 pos){
    float closestDist = 999999.0;
    int closestIdx = 0;
    for(int i = 0; i < MAX_PLANETS; i++){
        if(i >= planetsNum){break;}
        vec2 diff = vec2(planets[2*i], planets[2*i+1]).xy-pos.xy;
        float distSqr = diff.x*diff.x + diff.y*diff.y;
        if(distSqr < closestDist){
            closestDist = distSqr;
            closestIdx = i;
        }
    }
    return closestIdx;
}

void main() {
    vec2 center = vec2(x, y);
    vec2 offset = (gl_FragCoord.xy / vec2(width, width))-vec2(0.5);
    vec2 pos = center + offset * vec2(scale);

    vec2 dampingVec = vec2(damping);
    
    float total = 0.0;

    // the loop length has to be known at compile time (so cant be a uniform)
    // instead loop to a MAX and break where you actually want to loop to
    // https://stackoverflow.com/questions/38986208/webgl-loop-index-cannot-be-compared-with-non-constant-expression/39298265
    vec2 vel = vec2(0.0);
    for(int s=0;s<MAX_STEPS;s++){
        if(s>=steps){break;}

        // calculates acceleration from planets
        vec2 acceleration = vec2(0.0, 0.0);
        for(int planet = 0; planet<MAX_PLANETS; planet++){
            if(planet>=planetsNum){break;}
            vec2 curAccel = getAcceleration( pos, vec2(planets[2*planet], planets[2*planet+1]) );
            acceleration += curAccel;
        }

        // calculates acceleration from 'center force'
        // acceleration += sin((center-pos)/vec2(height));

        // clamps acceleration
        float clamped_len = min(max(length(acceleration), -accLimit), accLimit);
        acceleration = normalize(acceleration) * clamped_len;

        // adds acceleration to velocity
        vel += acceleration*stepSize;

        // dampens velocity
        vel *= pow(dampingVec, vec2(stepSize));

        // gl_FragColor = vec4(0, abs(acceleration.x)/10.0, 0, 1.0);
        // return;

        // adds velocity to position
        pos += vel * vec2(stepSize);
    }

    int c = findClosest(pos); // index for the closest planet

    // cant index an array from a non-constant expression
    // https://stackoverflow.com/questions/19529690/index-expression-must-be-constant-webgl-glsl-error
    if(c==0)
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    if(c==1)
        gl_FragColor = vec4(0.1333, 0.1333, 0.1333, 1.0);
    if(c==2)
        gl_FragColor = vec4(0.109, 0.365, 0.6, 1.0);
    if(c==3)
        gl_FragColor = vec4(1.0, 0.521, 0.552, 1.0);
    if(c==4)
        gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    if(c==5)
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}