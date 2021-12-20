all: build run
render: build-render run-render
	echo "Done"

build: main.cpp sim.cpp sim.h
	g++ main.cpp sim.cpp -o main -lm -lsfml-graphics -lsfml-window -lsfml-system -g

.PHONY: run
run:
	./main

build-render: render.cpp sim.cpp sim.h
	g++ render.cpp sim.cpp -o render -lm -g

.PHONY: run-render
run-render:
	./render

.PHONY: view
view:
	xdg-open output.ppm