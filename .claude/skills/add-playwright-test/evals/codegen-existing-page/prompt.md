---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Add this test. Scenario: a logged-in user opens the events page and searches for an event by title, and only matching events are listed. Codegen:
await page.goto("https://eventhub.rahulshettyacademy.com/events");
await page.getByPlaceholder("Search events").fill("Conference");
await page.getByRole("button", { name: "Search" }).click();
