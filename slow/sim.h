#ifndef SIM_H
#define SIM_H

typedef struct{
    int r;
    int g;
    int b;
} col3;

typedef struct{
    float x;
    float y;
} vector2;

// adds b to a
vector2 addVec2(vector2 a, vector2 b);
vector2 multVec2(vector2 a, double b);

typedef struct{
    vector2 pos;
    float mass;
    col3 col;
} attractor_t;

typedef struct{
    vector2 pos;
    vector2 vel;
} body_t;

float magnitude(vector2 vec);
float dist(vector2 p1, vector2 p2);
// float dist(body_t p1, vector2 p2);

#define G 0.4
// calculate the acceleration of p1 towards p2
vector2 calcAccel(vector2 p1, vector2 p2, double m2);

// calculates total acceleration pos would experience from all of bodies
vector2 calcAccels(vector2 pos, attractor_t* bodies, int nattractors);

// simulate a time step
void step(body_t *target, attractor_t* attractors, int nattractors, double t);

// returns the index of the closest attractor to pos
int closest(vector2 pos, attractor_t* abodies, int nbodies);

#endif