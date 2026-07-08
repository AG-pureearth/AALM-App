#!/bin/sh
# aalm-wine — run the AALM Windows engine under Wine on Linux.
#
# model_runner.py invokes this exactly like the .exe: it passes the input-file
# argument ("<name>/LeggettInput.txt") and sets the working directory to the
# runs root. Wine inherits both, so the engine's relative input and output
# paths resolve just as they do on Windows. No Python changes are needed — the
# app is pointed here via the AALM_EXE environment variable.
#
# Different Wine packages name the 64-bit loader differently (WineHQ uses
# "wine64"/"wine"; Ubuntu's distro package uses "wine64-stable"), so detect
# whichever is present rather than hard-coding one.
for w in wine64 wine64-stable wine; do
  if command -v "$w" >/dev/null 2>&1; then
    exec "$w" "/app/EPA AALM/AALM_64.exe" "$@"
  fi
done
echo "aalm-wine: no Wine loader (wine64 / wine64-stable / wine) found on PATH" >&2
exit 127
