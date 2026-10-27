import assert from "node:assert/strict";
import test from "node:test";
import { nextGuideIntroIndex, shouldShowGuideIntro } from "./intro-guide-lifecycle";

test("shows the guide intro until the visitor engages or dismisses it", () => {
  assert.equal(shouldShowGuideIntro({ explicitlyEngaged: false, dismissed: false }), true);
  assert.equal(shouldShowGuideIntro({ explicitlyEngaged: true, dismissed: false }), false);
  assert.equal(shouldShowGuideIntro({ explicitlyEngaged: false, dismissed: true }), false);
});

test("advances through stories once and holds on the final story", () => {
  assert.equal(nextGuideIntroIndex(0, 3), 1);
  assert.equal(nextGuideIntroIndex(1, 3), 2);
  assert.equal(nextGuideIntroIndex(2, 3), null);
});
