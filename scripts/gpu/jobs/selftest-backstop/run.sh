#!/bin/bash
# Safety self-test 2: cancel the instance's own hard shutdown, and the harness hangs after this, so only the
# EventBridge Scheduler backstop (deadline + grace) or reaper.py can end the instance.
shutdown -c && echo "selftest-backstop: cancelled the scheduled shutdown at $(date -u +%T)"
