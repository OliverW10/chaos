#include <cstdio>
#include <cmath>
#include <SFML/Graphics.hpp>

#include "sim.h"

int main()
{   
    const int dimx = 1000;
    const int dimy = 1000;

    const int midx = dimx/2;
    const int midy = dimy/2;

    sf::RenderWindow window(sf::VideoMode(dimx, dimy), "SFML works!");
    window.setFramerateLimit(60);
    sf::Vertex line[] =
    {
        sf::Vertex(sf::Vector2f(10.f, 10.f)),
        sf::Vertex(sf::Vector2f(150.f, 150.f))
    };
    sf::CircleShape shape(5.f);
    shape.setFillColor(sf::Color(0, 255, 0));
    shape.setPosition(midx, midy);


    const int rad = 200;
    const float angOffset = M_PI/3;

    const int allMass = 50000;

    const int planetsNum = 5;

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
    planets[3].col = (col3){255, 0, 0};
    planets[4].col = (col3){255, 0, 255};


    int steps = 5000;
    int step_stop = 1000;

    body_t body = (body_t){(vector2){0, 20}, (vector2){0, 0}};

    int progress = 0;
    while (window.isOpen())
    {
        sf::Event event;
        while (window.pollEvent(event))
        {
            if (event.type == sf::Event::Closed)
                window.close();
        }
        window.clear();

        sf::Vector2i position = sf::Mouse::getPosition(window);
        body = (body_t){(vector2){position.x, position.y}, (vector2){0, 0}};
        line[0].position.x = body.pos.x;
        line[0].position.y = body.pos.y;
        int last_closest = 0;
        int closest_streak = 0;
        for(int i = 0; i < steps; i ++){
            step(&body, planets, planetsNum, 3.f, 0.999f);

            line[1] = sf::Vertex(sf::Vector2f(line[0].position.x, line[0].position.y));
            line[0] = sf::Vertex(sf::Vector2f(body.pos.x, body.pos.y));
            window.draw(line, 2, sf::Lines);

            if(i == progress){
                // printf("body pos x:%f y:%f\n", body.pos.x, body.pos.y);
                if(body.pos.x > 0 && body.pos.x < dimx && body.pos.y > 0 && body.pos.y < dimy){
                    shape.setFillColor(sf::Color(255, 255, 255));
                    shape.setPosition(body.pos.x, body.pos.y);
                    window.draw(shape);
                }
            }

            int cur_closest = closest(body.pos, planets, planetsNum);
            if(cur_closest == last_closest){
                closest_streak ++;
            }else{
                closest_streak = 0;
            }
            last_closest = cur_closest;
            if(closest_streak > step_stop){
                printf("skipped %d, i: %d, progress: %d\n", steps-i, i, progress);
                if(progress > i){
                    progress = 0;
                }
                i = steps;
            }
        }

        // int closest_idx = closest(body.pos, planets, planetsNum);
        // printf("closest: %d\n", closest_idx);

        for(int i = 0; i < planetsNum; i++){
            shape.setFillColor(sf::Color(planets[i].col.r, planets[i].col.g, planets[i].col.b));
            shape.setPosition(planets[i].pos.x, planets[i].pos.y);
            window.draw(shape);
        }

        progress += 2;
        if(progress > steps){
            progress = 0;
        }

        window.draw(shape);

        
        window.display();
    }
}