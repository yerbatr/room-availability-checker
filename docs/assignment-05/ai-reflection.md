# AI Reflection

I used an AI assistant, GPT-6, while working through Assignment #05. I asked it to inspect the Smart Campus Room Availability Checker, read the repository instructions and assignment PDF, and work through the tasks in order. I supplied the project folder, existing tests and documentation, and earlier screenshots from the project. I asked GPT-6 to keep the app within scope and report only checks it had actually run.

The most useful suggestion was to keep the explanation adapter separate from the deterministic booking rules. GPT-6 compared `checkFlow.ts`, `explanationAdapter.ts`, and the feature contract, then recommended keeping the existing boundary. One weak suggestion was that documenting a manual UI gate could address the lack of browser tests. The added instructions make the verification process clearer, but they do not add automated coverage.

At my request, GPT-6 ran the test, typecheck, lint, and build commands. The recorded output showed 132 tests passing and the other checks succeeding. I also asked it to start the development server; the root page and app module returned HTTP 200. The screenshots I supplied show earlier manual checks for availability, conflict, blocked rooms, invalid time input, and explanation failure. I did not rerun every interface case during this assignment, so duration boundaries, endpoint-touch behavior, and room-switch refresh remain unverified here.

The updated `AGENTS.md` helped keep the work focused and made it harder to confuse a listed manual check with a completed one. Next time, I would plan an approved browser-testing approach earlier and record the results as I go.

