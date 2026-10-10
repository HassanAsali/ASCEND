# Add this showcase to GitHub

This kit updates the repository presentation. It does not update or deploy the ASCEND application.

## Files to upload

Copy the included `README.md` into the repository root and upload the included `docs/assets` folder at that exact path. Both are needed: the README refers to the local graphics through relative paths.

Keep the SVG/GIF filenames unchanged. Merge the assets folder with an existing `docs` folder rather than replacing unrelated documentation.

The banner uses a small animated GIF with stationary text. `hero.svg` is a static alternative: replace `docs/assets/hero.gif` with `docs/assets/hero.svg` in the README if a still banner is preferred.

The mode and workspace illustrations include narrower variants selected through the supported HTML `picture` element. Essential information also remains in the ordinary README text.

## Through the GitHub website

1. Open the existing repository.
2. Choose **Add file → Upload files**.
3. Upload `README.md` and the included `docs` folder. Do not upload the ZIP itself as the replacement README.
4. Keep `UPLOAD.md` only if you want these instructions in the repository; it is not required by the main page.
5. Preview the README and commit the presentation update.

## Through a local checkout

After copying this kit's README and graphics into the existing repository, review the staged files before committing:

```bash
git add README.md docs/assets/
git diff --cached --stat
git commit -m "Refresh ASCEND private beta showcase"
git push
```

Use these commands inside the already configured repository. Do not copy private application configuration or account files into the public showcase.

## Add real product screenshots later

The current graphics are original presentation illustrations, not screenshots of the running product. The README contains hidden comments with suggested screenshot placements. Once real images exist, put them in `docs/media`, then replace the corresponding comment with its Markdown image line.

| Filename | Capture |
| --- | --- |
| `ascend-command.png` | Full control Command with the identity strip and capture area. |
| `ascend-quests.png` | Several compact tasks and one expanded task showing real steps. |
| `ascend-focus.png` | A real unfinished step in the Focus space. |
| `ascend-study.png` | A selected course and its academic tasks. |
| `ascend-projects.png` | Required project work and its final objective. |
| `ascend-life-systems.png` | Routines and explicitly recorded measures. |
| `ascend-calendar.png` | Several tasks arranged on different dates. |
| `ascend-progress.png` | Levels, ranks, skills, and recorded activity. |
| `ascend-autopilot.png` | One primary next action. |
| `ascend-friends.png` | Optional social view using fictitious demo identities. |

Direct screen captures with demo content work best. Leave email addresses, private invitation/request links, credentials, recovery material, and personal task information out of the public images.

## Compatibility notes

The page uses repository-relative images, badges, native collapsed sections, and Mermaid code fences. GitHub sanitizes custom HTML/CSS, so the visual treatment lives in local image assets rather than a scripted README.

The preview was checked locally; the repository's own rendered README should be checked after upload. Mermaid rendering and badge delivery are provided by GitHub and the badge service, respectively. Badges and the verification illustration report a recorded release; they are not a live CI feed or security certification.

References:

- [GitHub: basic Markdown, images, and alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [GitHub: collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections)
- [GitHub: Mermaid diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- [GitHub Markup: HTML sanitization](https://github.com/github/markup)
