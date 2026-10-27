import assert from "node:assert/strict";
import test from "node:test";
import { createExitIntentTracker, isIntentionalViewportExit } from "./exit-intent";

const exit = { x:400, y:0, width:1200, height:800, relatedTarget:null, trusted:true, buttons:0, elapsed:5000, mouseObserved:true };

test("detects departures through all four viewport boundaries", () => {
  for (const point of [{x:400,y:0},{x:0,y:400},{x:1199,y:400},{x:400,y:799},{x:-10,y:200}]) {
    assert.equal(isIntentionalViewportExit({...exit,...point}), true);
  }
});
test("ignores internal transitions and iframe exits away from the viewport edges", () => {
  assert.equal(isIntentionalViewportExit({...exit,relatedTarget:new EventTarget()}), false);
  assert.equal(isIntentionalViewportExit({...exit,x:400,y:300}), false);
});
test("requires dwell and observed mouse interaction, never touch-only or synthetic exits", () => {
  assert.equal(isIntentionalViewportExit({...exit,elapsed:4999}), false);
  assert.equal(isIntentionalViewportExit({...exit,mouseObserved:false}), false);
  assert.equal(isIntentionalViewportExit({...exit,trusted:false}), false);
});
test("does not interrupt dragging", () => {
  assert.equal(isIntentionalViewportExit({...exit,buttons:1}), false);
});

test("repeats after reentry without repeating the initial five-second wait", () => {
  const tracker = createExitIntentTracker(1000);
  tracker.observeMouse();
  assert.equal(tracker.leave(exit, 5999), false);
  assert.equal(tracker.leave(exit, 6000), true);
  tracker.disarm(); // Closing the dialog rearms the listener, not the mouse visit.
  assert.equal(tracker.leave(exit, 6100), false);
  tracker.observeMouse();
  assert.equal(tracker.leave(exit, 6200), true);
  assert.equal(tracker.leave(exit, 6300), false);
  tracker.observeMouse();
  assert.equal(tracker.leave(exit, 6400), true);
});

test("ignored internal transitions do not consume an armed mouse visit", () => {
  const tracker = createExitIntentTracker(0);
  tracker.observeMouse();
  assert.equal(tracker.leave({...exit,relatedTarget:new EventTarget()}, 5000), false);
  assert.equal(tracker.leave(exit, 5001), true);
});
