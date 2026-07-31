---
name: Bug report
description: Report something that is not working as expected
title: "[Bug]: "
labels: [bug]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for helping improve Watermelon Workbench! 🍉
  - type: input
    id: obsidian-version
    attributes:
      label: Obsidian version
      placeholder: "e.g. 1.6.7"
    validations:
      required: true
  - type: input
    id: plugin-version
    attributes:
      label: Plugin version
      placeholder: "e.g. 0.1.0"
    validations:
      required: true
  - type: input
    id: os
    attributes:
      label: Operating system
      placeholder: "Windows / macOS / Linux / iOS / Android"
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: What did you do before the bug appeared?
      placeholder: |
        1. Open ...
        2. Click ...
        3. See ...
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: Actual behavior
    validations:
      required: true
