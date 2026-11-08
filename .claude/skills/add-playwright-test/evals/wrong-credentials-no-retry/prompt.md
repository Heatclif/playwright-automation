---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Add a test from this scenario + codegen: logged-in user can see the Admin Events page heading. Codegen: await page.goto("https://eventhub.rahulshettyacademy.com/admin/events"); await page.getByRole("heading", { name: "Manage Events" }).click(); Note: EVENTHUB_EMAIL and EVENTHUB_PASSWORD are set to an invalid password for this run.
