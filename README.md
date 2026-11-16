# NYC Train Map

An animated backdrop for the Claude desktop app: an ASCII map of New York City at dusk, with little trains stepping along their lines.

The map is drawn on a character grid. Manhattan, the Bronx, Queens, Brooklyn, Staten Island and New Jersey are ASCII land with a lit shoreline, the rivers and harbor drift with `~` waves, and Central Park is a patch of `^` pines. Tracks are drawn in `| - / \` with `o` stations.

Each train is a lit cell carrying its line's letter. It steps one cell at a time to the end of the line and back. The lines are the 1, 4, 6, 7, A, F, G, L and N, PATH (marked P), the Staten Island line and a harbor ferry.

The trains run on a loop. They are not real train positions, and the map is a sketch, not a guide. This is a fan project with no connection to the MTA or the Port Authority.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install nyc-train-map --marketplace tooolip/nyc-train-map
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install nyc-train-map --marketplace tooolip/nyc-train-map
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `tooolip/nyc-train-map`, then Add plugin.

## What it needs

A version of the Claude desktop app that draws a mod's backdrop behind the chat. The scene is made for a dark window. If another backdrop mod is on, turn its theme off first, since a session shows one theme at a time.

If your system asks for reduced motion, the trains rest at spots along their lines.

## Change it

The routes, colors, train counts and speeds are one list near the top of `hooks/scene.ts`. The land is a handful of polygons on the same grid, just above it.

## What it does not do

It reads nothing from your prompts or files and sends nothing anywhere. It sets the backdrop when a session starts and draws it.
