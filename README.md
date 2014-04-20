# Bucket Balls

Bucket Balls lets you connect multiple devices (Smartphones, Laptops,...).
Each device becomes a "Bucket". You can create some colored balls inside a bucket.
If the device supports the "deviceorientation"-event you can slop the balls from one bucket
into another. You can create rulesets to define which bucket is allowed to
drop its balls in which other buckets.

## Wanna see Bucket Balls in action?

Have a look at this Video on YouTube:

[Bucket Balls on YouTube](http://www.youtube.com/watch?v=0jePdRJipe4)

## Installation

Simply clone the project and run ```npm install``` inside the projects directory.

## Setup

You can setup bucket balls within the config.js file. There you can define rulesets and
and map client IDs to them.

## Run

When everything is setup you can start the server with ```node app.js```.
Afterwards connect the devices ('buckets') by calling http://[host:port]/client/[clientID]
in their browsers.
You can then init client 1 for example with 30 balls by typing this command into the
bucket command line:

```
buckets.getBucket(1).addBalls(30);
```