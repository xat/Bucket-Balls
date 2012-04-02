# Bucket Balls

Bucket Balls lets you connect multiple devices (Smartphones, Laptops,...).
Each device becomes a "Bucket". You can create some colored Balls inside a bucket.
If the device supports the "deviceorientation"-event you can slop the balls inside a bucket
into another bucket. You can define rulesets to define which bucket is allowed to
drop its balls in which other buckets.
Buckets Balls is build with Node.JS and box2d. It's a fun weekend project,
so I wont commit it to the NPM repository since I dont know if I will be able
to maintain it in future.

## Wanna see Bucket balls in action?

Have a look at this Video on YouTube:

[Bucket Balls on YouTube](http://www.youtube.com/watch?v=0jePdRJipe4)

## Installation

Simply clone the project and install express, socket.io and jqtpl in the projects directory
like this:

    npm install express
    npm install socket.io
    npm install jqtpl

## Setup

You can setup bucket balls within the config.js file. There you can define rulesets and
and map client IDs to them.

## Run

When everything is setup run the bucket balls server with _node app.js_.
Afterwards connect the devices ('buckets') by calling http://[host:port]/client/[clientID]
in their browsers.
You can then init client 1 for example with 30 balls by typing this command into the
bucket command line:

    buckets.getBucket(1).addBalls(30);

