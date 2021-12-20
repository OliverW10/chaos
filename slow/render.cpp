#include <cstdlib>
#include <cstdio>
#include <cmath>

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

int main(){
    const int dimx = 1000;
    const int dimy = 1000;

    const int rad = 100;
    const float angOffset = M_PI/3;

    const int midx = dimx/2;
    const int midy = dimy/2;

    const int allMass = 2000;

    const int planetsNum = 3;

    attractor_t planets[planetsNum];
    for(int i = 0; i < planetsNum; i++){
        float ang = angOffset+M_PI*2*((float)i/(float)planetsNum);
        printf("ang %f\n", ang);
        planets[i].pos = (vector2){midx+sin(ang)*rad, midy+cos(ang)*rad};
        planets[i].mass = allMass;
    }
    planets[0].col = (col3){0, 255, 0};
    planets[1].col = (col3){0, 0, 255};
    planets[2].col = (col3){255, 255, 0};
    // planets[3].col = (col3){255, 0, 0};
    // planets[4].col = (col3){255, 0, 255};

    char filename[20];

    // create buffer and fill
    int steps = 1000;
    int step_stop = 300;
    unsigned char buffer[dimx*dimy*3];
    // for(;steps < 5; steps+=5){
        for(int x = 0; x < dimx; x++){
            for(int y = 0; y < dimy; y++){
                int i = x*dimy + y;
                body_t body = (body_t){(vector2){x, y}, (vector2){0, 0}};
                int last_closest = 0;
                int closest_streak = 0;
                for(int i = 0; i < steps; i ++){
                    step(&body, planets, planetsNum, 3.f, 0.999f);
                    int cur_closest = closest(body.pos, planets, planetsNum);
                    if(cur_closest == last_closest){
                        closest_streak ++;
                    }else{
                        closest_streak = 0;
                    }
                    if(closest_streak > step_stop){
                        i = steps;
                    }
                }
                // float a = magnitude(calcAccels(body.pos, planets, planetsNum));
                // buffer[3*i] =   a*10;
                // buffer[3*i+1] = a*10;
                // buffer[3*i+2] = a*10;


                int closest_idx = closest(body.pos, planets, planetsNum);
                buffer[3*i] =   planets[closest_idx].col.r;
                buffer[3*i+1] = planets[closest_idx].col.g;
                buffer[3*i+2] = planets[closest_idx].col.b;
            }
            printf("did line %d\n", x);
        }

        for(int i = 0; i < planetsNum; i ++){
            int x = planets[i].pos.x;
            int y = planets[i].pos.y;
            int idx = x*dimy + y;
            buffer[3*idx] = planets[i].col.r/5;
            buffer[3*idx+1] = planets[i].col.g/5;
            buffer[3*idx+2] = planets[i].col.b/5;
        }

        sprintf(filename, "./outputs/output%d", steps);
        writeImage(filename, buffer, dimx, dimy);
        puts(filename);
    // }
}