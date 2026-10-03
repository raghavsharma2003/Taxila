#!/bin/bash
# Safety self-test 1: the harness hangs after this (HARNESS_SELFTEST_HANG), so only the instance's own
# `shutdown -h +MAX` (shutdown behaviour = terminate) can end the instance.
echo "selftest-hard: job body done at $(date -u +%T); harness will now hang"
