#!/bin/sh
# aalm-wine — run the AALM Windows engine under Wine on Linux.
#
# model_runner.py invokes this exactly like the .exe: it passes the input-file
# argument ("<name>/LeggettInput.txt") and sets the working directory to the
# runs root. Wine inherits both, so the engine's relative input and output
# paths resolve just as they do on Windows. No Python changes are needed — the
# app is pointed here via the AALM_EXE environment variable.
exec wine64 "/app/EPA AALM/AALM_64.exe" "$@"
