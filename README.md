# 👁️ Argus: A Visually-Driven, Out-of-the-Box RPA Scraper

*[🇨🇳 简体中文 (Simplified Chinese) 请向下滚动浏览]*

> "Other scrapers require you to master Python and reverse engineering. Argus just requires you to have a hand that can click a mouse."

Hello, stranger. Welcome to the official release page of Argus.

This started as my personal desktop RPA automation hub, built out of the sheer pain of repeating hundreds of web clicks daily. It worked so well that I decided to pack it up and share it with the world.

### 🛠️ Tech Stack Revelation
The UI rendering layer of this project is built with a modern stack of **React 18 + TailwindCSS + Vite**, while the core relies on **Electron** for cross-platform orchestration.
*(Note: To protect intellectual property, this repository currently only open-sources the UI architecture and IPC communication skeleton. The underlying RPA execution brain, anti-fingerprint sandbox, and anti-popup algorithms have been physically isolated.)*

### ✨ Why Argus? (Or why it deserves your disk space)

- 🎯 **WYSIWYG Visual Picker**: Built-in stealth browser. Point and click without knowing what XPath is. The system automatically generates the most robust element selectors for you.
- 🤖 **Smart Popup Skipper**: We all hate those "New User Gifts" or "Remind Me Later" popups right after logging in. Argus features a low-level debounce and DOM area-scoring algorithm to accurately dismiss all stumbling blocks with your eyes closed.
- 🕒 **True Background CRON Scheduler**: Supports high-frequency polling. You can go to sleep while Argus monitors the market at midnight and takes screenshots for you.
- 📨 **Direct to Boss's Desktop**: Natively integrates Slack / Feishu (Lark) webhook channels with HMAC SHA256 signature encryption. Got the ticket? Data dropped? It pushes messages more punctually than your alarm.

### 🚀 Getting Started

Look to the **Releases** section on the right side of this page. Download the installer for your OS (Windows / macOS). Double-click to install, and start automating!

---
---

# 🇨🇳 简体中文介绍

# 👁️ Argus：一个不按套路出牌的可视化 RPA 爬虫

> “别人家的爬虫需要你精通 Python 和逆向，而 Argus 只需要你有一只会按鼠标的手。”

你好，陌生人。欢迎来到 Argus 的发布主页。

这原本是我为了解决自己“爬数据”“抢Termin”“定点拉数据表”的痛苦而搞出来的私人桌面级 RPA 自动化中枢。但因为越做越顺手，我决定把它以安装包的形式分享出来。

### 🛠️ 技术栈揭秘
本项目的 UI 渲染层采用了 **React 18 + TailwindCSS + Vite** 的现代化构建方案，底层基于 **Electron** 实现跨平台调度。
*(注：为保护核心知识产权，本仓库目前仅开源 UI 架构与渲染层通信骨架。底层 RPA 执行大脑、防指纹沙盒以及反弹窗算法引擎已被物理隔离。)*

### ✨ 为什么选择 Argus？（或者是它凭什么占你硬盘）

- 🎯 **所见即所得的视觉拾取**：内置无痕浏览器，鼠标指哪打哪，不用懂什么叫 XPath，系统自动帮你生成最稳的元素选择器。
- 🤖 **智能跳过页面弹窗**：我们都知道现在的网站一登录就爱弹各种“新人大礼包”、“稍后提醒我”。Argus 内置了底层的防抖动与面积打分算法，闭着眼睛帮你精准点掉所有绊脚石。
- 🕒 **真·后台定时任务**：支持高频轮询任务。你可以去睡觉，Argus 帮你半夜盯盘，还能顺带截个图。
- 📨 **消息直达老板桌面**：原生集成 Slack / 飞书（带签名强加密）消息推送通道。抢到票了？数据跌了？它比你女朋友的消息还准时。

### 🚀 如何开始？

在这个页面右侧找到 **Releases**，下载适用于你系统 (Windows / macOS) 的安装包。双击安装，点开即用。
