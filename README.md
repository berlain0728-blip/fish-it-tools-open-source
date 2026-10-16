# Tide Tools — source edition

A small, static player-tool website extracted from the Fish It Tools project. **The tools use fictional catalogue data. Original, source-attributed Fish It guide summaries are included separately as dated references, with unresolved conditions kept explicit.** The original project remains separate.

MIT-licensed original application code. No third-party game images, wiki dumps, video frames, copied announcement bodies, private research, credentials or old Git history are included. See [RIGHTS.md](RIGHTS.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Run locally

Requires Node.js 20 or newer and Python 3. There are no npm dependencies. The package is marked `private` to prevent accidental npm publishing; this does not control GitHub repository visibility.

```sh
npm ci
npm run check
npm start
```

Open http://localhost:4187. The server listens only on this computer. Stop it with Control+C. Rebuild after editing source with `npm run build`.

## Included features

- Budget upgrade planner with a reserve, capacity filter, ownership and unlock checks, exclusion reasons, and strict evidence gates.
- Separate price, listed-luck, speed and capacity comparisons for two or three rods.
- Manual rod and rod-plus-bait comparisons with shareable value links. Listed luck is not a catch probability.
- Searchable sample collection, linked demo item/location pages, original tool-use guides and 68 source-attributed historical game guides (73 guides including five website walkthroughs).
- Local saved goals, wanted/caught states and JSON backup export/merge import.
- Dark responsive layout, keyboard controls, static content without JavaScript and a visible demo notice on every page.

The sample catalogue has four invented rods, two invented baits, three invented fish and two imaginary locations. The historical game guides cover equipment quests, acquisition, places and target-fish preparation; they are not proof of current access or a complete game inventory. No example is a recommendation to buy real equipment. Strict mode deliberately returns no verified candidates.

## Data and customization

Edit `src/data.mjs` to replace fictional fixtures with data you are authorized to distribute. Keep field units, unknown values and conflicts explicit. Numeric `null` means unknown, not zero. A real game integration needs evidence, an actual current version and correct rights attribution; do not mark demo records verified just to obtain planner results.

`src/planner.mjs`, `src/current-evidence.mjs` and `src/availability.mjs` contain the conservative planning gates. `src/manual-comparison.mjs` handles manually supplied values and URL restoration. Storage is local to the current browser origin. Share links expose the numeric values in their URLs. No game login, ads, analytics, backend, scraper or automatic download is included.

## Build and deploy

`npm run build` writes `dist/`. Serve that directory at an origin root, not a repository subpath. The checked-in source is not a hosted website. The source edition is `noindex` by default. It does not imply that a current game catalogue, player trial, production performance check, public contact channel or trademark clearance has been completed.

Build output, installed dependencies, private configs and research are ignored. Do not commit them. Use the source tests and package check before sending a contribution.

## 中文说明

这是从原项目整理出的原创代码开源版。工具、深色界面、搜索、收藏与备份功能可以运行；原整套游戏图鉴、抓取原文和未获授权的图片未包含，工具示例图鉴为虚构数据；原创整理的游戏任务、获取和路线攻略另行保留，注明来源与历史资料限制。原私有项目及备份独立保留。公开源码不代表原网站已正式上线，也不代表取得游戏素材或商标授权。
