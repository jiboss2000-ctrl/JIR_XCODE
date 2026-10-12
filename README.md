# Jersey Engine Pro for Adobe Illustrator

## Install the unpacked panel on macOS

This panel uses Adobe's CEP extension format. From this folder, run:

```sh
./install.sh
```

The installer copies the panel to `~/Library/Application Support/Adobe/CEP/extensions/com.jerseyengine.pro` and enables unsigned CEP extensions for CSXS.12, the runtime used by the installed Illustrator 2026 application. Restart Illustrator, then choose **Window > Extensions (Legacy) > Jersey Engine Pro Nesting**.

Select the jersey pieces in Illustrator before starting nesting. If Illustrator is already open, close and restart it after installation so it discovers the panel.

## Troubleshooting

Do not run `core.jsx` with Node.js or VS Code's **Run Code** command. It uses Illustrator's ExtendScript APIs and is loaded by the CEP panel through Illustrator. A Node error such as `Cannot find module '.../vscode.git.Git.log'` is from a Node/VS Code launch target, not from this extension's host script. Stop that Node launch, restart Illustrator, and open **Window > Extensions (Legacy) > Jersey Engine Pro Nesting**.

If the panel does not appear, run `./install.sh` again, then fully quit and reopen Illustrator.
