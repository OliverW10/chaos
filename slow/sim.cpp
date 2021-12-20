#include <cmath>
#include <cstdio>
#include "sim.h"

float magnitude(vector2 vec){
    return sqrt(vec.x*vec.x + vec.y*vec.y);
}

float distanceSqr(vector2 p1, vector2 p2){
    float dx = p1.x - p2.x;
    float dy = p1.y - p2.y;
    return dx*dx + dy*dy;
}

float distance(vector2 p1, vector2 p2){
    return sqrt(distanceSqr(p1, p2));
}

vector2 calcAccel(vector2 pos, vector2 other, double m2){
    double dx = (other.x-pos.x); // x and y distances
    double dy = (other.y-pos.y);
    double distS = dx*dx + dy*dy; // dist squared
    double dist = sqrt(distS);
    double mag = 0.5*G*m2/distS; // magnitude of change
    vector2 ret;
    // normalize dx and dy and multiply by magnitude
    ret.x = mag * dx/dist;
    ret.y = mag * dy/dist;
    return ret;
}

vector2 calcAccels(vector2 pos, attractor_t* attractors, int nattractors){
    vector2 total = {0, 0};
    for(int i = 0; i < nattractors; i++){
        vector2 ret = calcAccel(pos, attractors[i].pos, attractors[i].mass);
        total.x += ret.x;
        total.y += ret.y;
    }
    return total;
}

void step(body_t* target, attractor_t* attractors, int nattractors, double t, double damping){
    // gets the instintaneous acceleration caused by gravity and applies it constantly over t time
    // for a object with constant acceleration its displacement after t is
    // ut + 1/2at^2
    // where u is initial velocity, a is acceleration and t is time

    // copies position at start to caluclate new velocity at end
    vector2 start_pos = target->pos;
    // adds targets velocity times the delta time to its pos ( ut )
    target->pos.x += target->vel.x * t * damping;
    target->pos.y += target->vel.y * t * damping;

    // gets a
    vector2 accel = calcAccels(target->pos, attractors, nattractors);

    // clamps acceleration, beacuse the acceleration is inverse to r^2
    // when r (distance) nears 0 the acceleration gets very big beacuse its a hyperbola
    accel.x = fmax(-0.02f, fmin(0.02f, accel.x));
    accel.y = fmax(-0.02f, fmin(0.02f, accel.y));
    // printf("accel x:%f, y:%f\n", accel.x, accel.y);

    // + 1/2at^2
    target->pos.x += 0.5*accel.x*t*t;
    target->pos.y += 0.5*accel.y*t*t;

    // new velocity is amount moved in the time step over time
    target->vel.x = (target->pos.x - start_pos.x)/t;
    target->vel.y = (target->pos.y - start_pos.y)/t;
}

int closest(vector2 pos, attractor_t* bodies, int nbodies){
    int cur = -1; // current closest
    int cur_dist = 999999; // will return -1 if all bodies are further than this
    for(int i = 0; i < nbodies; i++){
        float dist = distanceSqr(bodies[i].pos, pos);
        if(dist < cur_dist){
            cur = i;
            cur_dist = dist;
        }
    }
    return cur;
}