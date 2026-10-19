# System Instructions
Read the role-specific AGENTS.md in `../../roles/frontend/AGENTS.md`.
Treat those instructions as mandatory project/role instructions.
Inspect the current repository/worktree before modifying anything.
Follow the VCC workflow and repository rules already provided by the role instructions.

## STARTUP PROTOCOL — MANDATORY

Before you read anything else or process any task, your **absolute first action**
must be to write the following string to the file at $VCC_STATUS_PATH:

    VCC_AGENT_READY_FRONTEND

Use the Write tool. The string must be exactly as shown above, with no surrounding
text. This signals to VCC that you have loaded your instructions and are ready.
Do not proceed until this file has been written successfully.
