# 个人学术主页

一个简约的个人学术网站框架，使用原生 HTML、CSS 和 JavaScript，不需要安装依赖或执行构建。包含首页、Publications 和 Blog 三个页面，并支持手机浏览。

姓名已填写为 Xia zhewei（夏哲炜），首页照片下方显示中英文姓名，导航、页脚和浏览器标题使用英文名。HSPFuzzer 的论文资料与 PDF、代码和 DOI 链接已填写；博客仍为示例内容，发布前请替换为自己的文章。

## 本地预览

在网站根目录运行：

```bash
python3 -m http.server 8000
```

然后访问 [http://localhost:8000](http://localhost:8000)。在 Windows 上也可使用 `python -m http.server 8000`。按 `Ctrl+C` 停止预览。

## VS Code 工作区

在 VS Code 中通过 **文件 → 从文件打开工作区** 打开根目录的 `academic-homepage.code-workspace`。工作区已包含整个网站目录、保存时自动格式化、预览和脚本检查任务，不需要安装 Live Server 或额外格式化扩展。预览任务需要 Python 3，脚本检查需要 Node.js，F5 浏览器调试使用已安装的 Chrome 和 [VS Code 内置浏览器调试器](https://code.visualstudio.com/docs/nodejs/browser-debugging)。

项目位于 WSL 目录时，可在已配置 [VS Code WSL 支持](https://code.visualstudio.com/docs/remote/wsl) 的 WSL 终端中打开：

```bash
cd /home/humb1e/my_website
code academic-homepage.code-workspace
```

也可以在 Windows 本地的 VS Code 窗口中打开同一个工作区文件。任务会按运行环境选择命令：WSL 使用 `python3`，Windows 使用 `python`；`node` 也需要能在当前环境的终端中运行。

- **F5**：选择启动预览的 Chrome 配置，自动运行后台的“预览网站”任务并打开首页。
- **Ctrl+Shift+P → Tasks: Run Task → 预览网站**：单独启动服务器，再访问 [首页预览](http://localhost:8000/index.html)。
- **Ctrl+Shift+B**：运行组合任务“检查脚本”，检查 `content.js` 和页面脚本的 JavaScript 语法；也可以通过 Tasks: Run Task 分别选择“检查内容脚本”或“检查页面脚本”。
- 修改后保存文件，在浏览器刷新查看。语法检查之外，页面布局和交互可直接在浏览器确认。

如果 8000 端口已有本项目的预览服务，可在“运行和调试”中选择“打开现有预览”配置后按 F5，复用已有服务；如要用工作区任务启动预览，请先关闭旧服务。预览任务持续运行，停止浏览器调试不会关闭服务器。在对应任务终端按 `Ctrl+C`，或使用 **Tasks: Terminate Task → 预览网站**，可停止工作区启动的服务。

## 修改内容

- `assets/js/content.js`：集中修改个人资料、研究方向、教育经历、论文、博客以及相关链接。
- `index.html`：首页结构。
- `publications.html`：论文列表页结构。
- `blog.html`：博客列表页结构。
- `assets/css/style.css`：调整字体、颜色、间距和响应式布局。

`content.js` 中的 `window.SITE_CONTENT` 按以下字段组织：

| 字段 | 用途 |
| --- | --- |
| `profile` | 姓名、职位、单位、简介及导师链接、头像、邮箱、研究方向和外部链接 |
| `education` | 教育经历的学校、学院、学位、专业及时间 |
| `publications` | 论文标题、作者、会议或期刊、年份和资源链接 |
| `posts` | 博客标题、日期、摘要及正文段落 |

首页采用左侧个人资料、右侧简介及 Education 教育经历的简洁布局。论文和博客各自在独立页面直接展示列表，不设搜索和分类筛选。三个页面不显示装饰性小标题，论文和博客列表页也不显示大标题、介绍文字或数量统计。

英文名填写在 `assets/js/content.js` 中的 `profile.name`，中文名填写在可选的 `profile.nameZh` 中，无需手动合并。首页左侧照片下方根据可用宽度显示姓名：同一行时为 `Xia zhewei（夏哲炜）`；空间不足时中文名另起一行，显示 `夏哲炜`，不加括号。中文名留空时只显示英文名。导航、页脚和浏览器标题统一使用 `profile.name`。

首页英文简介维护在 `profile.intro` 中，身份表述为 `Ph.D. student`。简介中的 `{sunCong}`、`{zengYingpei}` 会使用 `profile.introLinks` 对应键下的 `{ label, url }` 配置显示导师姓名链接；更改导师姓名或主页地址时只需修改这份配置。

Education 位于首页简介之后，通过 `education` 数组维护，不显示导师。每项包含 `institution`（大学）、`degree`（学位）、`major`（专业），以及可选的 `school`（学院）和 `period`（时间，可留空）。学位与专业以逗号连接，显示为“学位, 专业”。当前为 Xidian University 的 Faculty of Cybersecurity & Cryptology 的 `Ph.D., Cyberspace Security`（`2026–Present`）和 Hangzhou Dianzi University 卓越学院（Honors College）的 `Bachelor's degree with honors, Cyberspace Security`（`2022–2026`）；将数组设为 `[]` 可隐藏整个区块。

`profile.email` 填写纯文本邮箱地址，首页会直接显示，不添加超链接；留空时隐藏。邮箱、学校和位置使用同款线条小图标。`profile.links` 中的其他联系方式仍显示为链接。

头像缩写自动取英文名前两个单词的首字母，因此 `Xia zhewei` 显示为 `XZ`。如需自定义头像缩写，可在 `profile` 中设置 `initials` 字段。导航标识和浏览器图标使用英文名的首字母，随姓名自动更新。

论文作者的 `authors` 字符串支持 `{name}` 占位符，例如 `authors: '{name}, 合作者'`，显示时自动替换为 `profile.name`。也可以直接填写完整作者字符串。

每篇论文可通过 `links` 数组配置可选资源链接：

```javascript
links: [
  { label: '.pdf', url: '' },
  { label: '.artificial', url: '' }
]
```

填写有效地址后，论文下方会显示 `[.pdf]`、`[.artificial]` 等方括号文本链接；空地址不显示，也可删除不需要的条目。网站内的 PDF 可使用 `assets/files/paper.pdf` 等相对路径，外部资源可填写完整 HTTPS 网址。

目前 HSPFuzzer 已配置 `[.pdf]`、`[code]` 和 `[doi]` 三个链接。PDF 使用本地文件 `assets/files/hspfuzzer.pdf`，随网站一起托管；文件原样下载自导师主页的公开地址 `https://zyingp.github.io/files/25-HSPFuzzer.pdf`。代码和 DOI 继续使用外部链接。

论文的 `example: true` 表示示例内容，换成真实内容后可以改为 `false`。博客同样用 `example` 标记示例。每篇博客使用唯一的 `slug`，正文写入 `paragraphs` 数组，通过 `blog.html?post=<slug>` 阅读，无需创建额外路由文件。链接和简历地址可在有真实资源后填写。

页面和静态资源使用相对 URL，因此既可以放在 `https://用户名.github.io/`，也可以放在 `https://用户名.github.io/仓库名/`，不需要修改部署路径。

## 发布到 GitHub Pages

推荐使用分支发布，适合这个无需构建的静态网站。

1. 在 GitHub 创建仓库。个人主页仓库名使用 `用户名.github.io`；项目网站可使用任意仓库名。
2. 将本目录中的网站文件上传或推送到仓库的 `main` 分支，确保 `index.html` 位于仓库根目录，且包含 `.nojekyll` 文件。
3. 打开仓库的 **Settings → Pages**。
4. 在 **Build and deployment → Source** 选择 **Deploy from a branch**。
5. 选择 **main** 分支和 **/(root)** 文件夹，点击 **Save**。
6. 等待 Pages 发布完成，访问该设置页显示的网站地址。后续更新 `main` 分支即可重新发布。

`.nojekyll` 告诉 GitHub Pages 直接发布这些静态文件。仓库尚未配置或推送，此框架不会自行连接 GitHub 账户。分支发布步骤参考 [GitHub 官方发布来源文档](https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 可选：使用 GitHub Actions

项目已提供 `.github/workflows/deploy.yml`，初始只有手动触发，不会因推送而运行。如果使用上面的分支发布方式，可以直接保留此文件，无需操作。

要切换到 Actions 发布：

1. 确保工作流文件已位于仓库的默认分支。
2. 在 **Settings → Pages → Source** 选择 **GitHub Actions**。
3. 打开 **Actions → Deploy static website to GitHub Pages → Run workflow**，选择 `main` 分支并运行。
4. 工作流成功后，在 Pages 设置页查看网站地址。

工作流使用 GitHub 官方 Pages actions，直接上传静态文件并发布，无需 npm 或其他构建工具。需要的 `pages: write`、`id-token: write` 权限及 `github-pages` environment 已配置。参见 [GitHub 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

如需以后每次推送自动发布，可将工作流的 `on` 部分改为：

```yaml
on:
  workflow_dispatch:
  push:
    branches:
      - main
```

如果默认分支不是 `main`，请同时修改触发分支和 Pages 发布设置。
