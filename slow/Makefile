all: build view

build: main.c sim.c sim.h
	gcc main.c sim.c -o main -lm -g

.PHONY: view
view:
	./main
	xdg-open output.ppm