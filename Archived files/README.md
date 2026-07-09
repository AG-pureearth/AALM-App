# Archived files

These files are **not needed to run the app with Docker + Wine**. They're kept here for
reference rather than deleted. Nothing in the running app (`Dockerfile.wine`, `backend/`,
`frontend/`, `shared/`, `EPA AALM/`, `docker/`) depends on them.

| File | What it was |
|------|-------------|
| `Dockerfile` | The original base container image (bring-your-own Linux binary). Superseded by `Dockerfile.wine`, which bundles the engine and runs it via Wine. |
| `Summary.md` | Overview of the AALM model. |
| `Input Variables.md` | Reference for the model's input parameters. |
| `.Rhistory` | Stray R console history; not part of the app. |

To restore any of these, move it back up to the app folder.
