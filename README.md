<h1 align="center">Argus RPA</h1>

*[🇨🇳 简体中文 (Simplified Chinese) 请向下滚动浏览]*
_____________________________________________________
Argus is a lightweight, visually-driven Robotic Process Automation (RPA) tool and web scraper. Designed with a local-first architecture, it enables automated data extraction and workflow execution without requiring complex scripting.

### 🛠️ Architecture Notice
The UI rendering layer is built with **React 18 + TailwindCSS + Vite**, while the core relies on **Electron** for cross-platform orchestration.<br>
*(Note: This repository open-sources the UI architecture and IPC communication skeleton. The underlying RPA execution engine, anti-fingerprint sandbox, and anti-popup algorithms are physically isolated to protect proprietary logic.)*

### ✨ Core Features
- **Visual Element Picker:** Built-in isolated browser environment supporting DOM inspection and automatic CSS/XPath selector generation.
- **Node-based Workflow Engine:** Supports sequenced automation primitives including navigation, DOM interaction, condition branching, and execution delays.
- **Smart Popup Evasion:** Implements heuristic DOM-scoring and keyword matching to automatically bypass intrusive post-navigation popups.
- **Local Tesseract OCR:** Offline image-to-text recognition for circumventing canvas-based or non-standard text rendering.
- **Webhooks & Notification Bus:** Built-in HMAC SHA256 signed message delivery for Slack and Feishu (Lark), supporting handlebar-based message templating.
- **Visual Runtime Monitoring:** Generate task-specific charts using Recharts, with .csv / .txt data export.
- **Cron Scheduling:** Background task polling with isolated partition cookies for concurrent multi-account execution.
- **Local Data Privacy:** 100% local SQLite persistence with OS-level encrypted storage for secrets (`safeStorage`). No cloud sync.

### 🚀 Installation 
Pre-built binaries for macOS and Windows are available in the [Releases](https://github.com/nexen33/ArgusRPA/releases) page.
- **macOS:** Download `Argus-v1.3.5.dmg` & `Argus-v1.3.5-arm64.dmg`.
- **Windows:** Download `Argus Setup 1.3.53.exe`.

### ⚠️ Disclaimer
Argus is provided "as-is" for educational and personal workflow automation purposes only. The user assumes all responsibility for adhering to the Terms of Service and `robots.txt` policies of the target websites. The author holds no liability for any misuse, account suspension, or legal disputes arising from the use of this software.

---
---
_____________________________________________________
# 🇨🇳 简体中文介绍

<h1 align="center">Argus RPA</h1>

Argus 是一款轻量级、视觉驱动的桌面级 RPA 与 网页数据 提取工具。项目采用完全本地化的架构设计，无需编写复杂脚本即可实现自动化的工作流调度。

### 🛠️ 架构说明
本项目的 UI 渲染层采用了 **React 18 + TailwindCSS + Vite** 构建，底层基于 **Electron** 实现跨平台调度。<br>
*(注：为保护核心知识产权，本仓库目前仅开源 UI 架构与渲染层通信骨架。底层 RPA 执行大脑、防指纹沙盒以及反弹窗算法引擎已被物理隔离。)*

### ✨ 核心功能
- **可视化元素拾取:** 内置隔离沙盒浏览器，支持通过鼠标悬停实时解析 DOM 树，并自动生成高鲁棒性的 CSS/XPath 选择器。
- **流程编排引擎:** 提供完整的自动化原语，包含页面导航、元素交互、条件分支 (Condition) 及本地计算节点。
- **启发式弹窗规避:** 采用 DOM 面积计算与词典打分机制，静默检测并自动关闭登录后的各类强插屏干扰弹窗。
- **纯离线 OCR:** 整合 Tesseract 引擎，针对 Canvas 渲染或非标准文本执行纯本地的图像到文本识别。
- **签名级消息总线:** 原生集成 Slack 与飞书 Webhook 推送接口，基于 HMAC SHA256 算法实现鉴权，支持 Markdown 模板动态注入。
- **可视化运行监控:** 通过Recharts对具体任务生成图表，并提供导出 .csv 和 .txt 数据格式。
- **Cron 调度与沙盒隔离:** 支持细粒度的定时轮询任务，且为每个批次任务分配独立的 Cookie 隔离分区，实现多账号并发免串签。
- **本地加密存储:** 所有的运行数据与爬取结果均落地至本地 SQLite 数据库，核心 Token 使用系统级 API (`safeStorage`) 进行物理级加密，零云端上传。

### 🚀 下载与安装 
请前往 [Releases](https://github.com/nexen33/ArgusRPA/releases) 页面获取编译好的安装包：
- **macOS:** 下载 `Argus-v1.3.5.dmg` 或 `Argus-v1.3.5-arm64.dmg`。
- **Windows:** 下载 `Argus Setup 1.3.53.exe`。

### ⚠️ 免责声明 (Disclaimer)
本软件按“原样”提供，仅供个人学习、技术研究及合法的工作流自动化使用。用户在使用本软件时，必须严格遵守目标网站的《服务条款》(ToS) 及 `robots.txt` 爬虫协议。因滥用本软件（包括但不限于高频抓取、逆向破解等）导致的目标网站服务异常、账号封禁或任何相关法律纠纷，软件开发者不承担任何直接或连带法律责任。
_____________________________________________________
<p align="center">
  <img width="7550" height="2160" alt="Image" src="https://github.com/user-attachments/assets/af46f871-6df4-4b43-b1b4-863f9b6dce31" />
</p>


<p align="center">
  <em>Viel Spaß damit!</em><br />
  <em>Entwickelt mit ❤️ von Tun&PaMa Familie</em><br />
  <em>Copyright © 2026 Tun & PaMa AG</em>
</p>
