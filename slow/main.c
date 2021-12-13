#include <stdlib.h>
#include <stdio.h>
#include <math.h>

#include "sim.h"

void writeImage(
    char* filename,
    unsigned char *buffer,
    int w,
    int h
){
    FILE *fp = fopen(filename, "wb"); /* b - binary mode */
    (void) fprintf(fp, "P6\n%d %d\n255\n", w, h); // write header

    int i, j;
    (void) fwrite(buffer, w*h*3, 1, fp);
    (void) fclose(fp);
}

int main(void)
{   
    const int dimx = 300, dimy = 300;
    const int rad = 100;

    attractor_t planets[3];
    planets[0].pos = (vector2){150+sin(M_PI*2/3)*rad, 150+cos(M_PI*2/3)*rad};
    planets[0].mass = 10;
    planets[0].col = (col3){0, 255, 0};

    planets[1].pos.x = 150+sin(M_PI*4/3)*rad;
    planets[1].pos.y = 150+cos(M_PI*4/3)*rad;
    planets[1].mass = 10;
    planets[1].col = (col3){0, 0, 255};

    planets[2].pos.x = 150+sin(0)*rad;
    planets[2].pos.y = 150+cos(0)*rad;
    planets[2].mass = 10;
    planets[2].col = (col3){255, 255, 0};


    // create buffer and fill with black
    unsigned char buffer[dimx*dimy*3];
    for(int x = 0; x < dimx; x++){
        for(int y = 0; y < dimy; y++){
            int i = x*dimy + y;
            // buffer[3*i] = 0;
            // buffer[3*i+1] = 0;
            // buffer[3*i+2] = 0;
            int d = (magnitude(calcAccels( (vector2){x, y}, planets, 3)))*400;
            buffer[3*i] = d;
            buffer[3*i+1] = d;
            buffer[3*i+2] = d;
            // printf("%d\n", buffer[i]);
        }
    }

    for(int i = 0; i < 3; i ++){
        int x = planets[i].pos.x;
        int y = planets[i].pos.y;
        int idx = x*dimy + y;
        buffer[3*idx] = planets[i].col.r;
        buffer[3*idx+1] = planets[i].col.g;
        buffer[3*idx+2] = planets[i].col.b;
    }

    body_t body = {143, 0};
    int steps = 500;
    for(int i = 0; i < steps; i ++){
        step(&body, planets, 2, 10.f);
        float clamtedX = fmin(fmax(body.pos.x, 0), dimx);
        float clamtedY = fmin(fmax(body.pos.y, 0), dimy);
        int idx = ((int)clamtedX)*dimx + ((int)clamtedY);
        printf("vx:%f, vy:%f, x:%f  y:%f\tidx:%d\n", body.vel.x, body.vel.y, body.pos.x, body.pos.y, idx);
        if(idx < 0)
            idx = 0;
        if(idx > 3*dimx*dimy)
            idx = 3*dimx*dimy-1;
        buffer[3*idx] =   255;
        buffer[3*idx+1] = 255-(255*i/steps);
        buffer[3*idx+2] = 255-(255*i/steps);
    }
    writeImage("output.ppm", buffer, dimx, dimy);
}