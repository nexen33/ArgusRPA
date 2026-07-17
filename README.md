<h1 align="center">Argus RPA</h1>
_____________________________________________________
### 🔑 Unlock Pro Version / 获取完整授权
Loving the 7-day trial? Support the solo dev and grab a key to keep using the Pro version!
如果您觉得对应 Trial 的7天试用版好用的话，欢迎支持独立开发者，继续获取授权密钥以继续使用 Pro 版本！

<div align="center">
  <!-- Buy Me a Coffee (Global Users) -->
  <a href="https://buymeacoffee.com/tunpama/extras" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;width: 181px !important;" >
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <!-- Afdian (Mainland China Users) -->
  <a href="https://ifdian.net/a/argus" target="_blank">
    <img src="https://pic1.afdiancdn.com/static/img/welcome/button-sponsorme.png" alt="去爱发电赞助" style="height: 50px !important;width: 181px !important;">
  </a>
</div>

<br/>

> ⚠️ **IMPORTANT / 购买须知**：
> License keys are bound to your hardware ID. Please leave your **[Hardware ID]** in the checkout notes. Keys will be delivered manually via Direct Message / Email within 24 hours.
> 授权密钥与您的机器码绑定。付款时请务必在订单备注中留下您的 **[机器码]**。您会在 24 小时内通过提供的可用渠道收到您的专属密钥。
_____________________________________________________
*[🇨🇳 简体中文 (Simplified Chinese) 请向下滚动浏览]*
_____________________________________________________
Argus is a lightweight, visually-driven Robotic Process Automation (RPA) tool and web scraper. Designed with a local-first architecture, it enables automated data extraction and workflow execution without requiring complex scripting.

### 🛠️ Architecture Notice
The UI rendering layer is built with **React 18 + TailwindCSS + Vite**, while the core relies on **Electron** for cross-platform orchestration.<br>
*(Note: This repository open-sources the UI architecture and IPC communication skeleton. The underlying RPA execution engine, anti-fingerprint sandbox, and anti-popup algorithms are physically isolated to protect proprietary logic.)*

### ✨ Core Features
- **Visual Element Picker with Fallback:** Built-in isolated browser environment supporting element inspection. Features independent dual-shortcut picking, a unified smart penetration algorithm with automatic CDP/DOM fallback mechanisms, and the ability to re-pick elements dynamically mid-flow.
- **Node-based Workflow Engine:** Supports sequenced automation primitives (navigation, interaction, condition branching). Includes pre-click content validation, dynamic UUID/Token replacement in URLs, and one-click import from Chrome DevTools Recorder to drastically reduce manual configuration.
- **Smart Network Interception:** Captures network responses dynamically and intelligently intercepts irrelevant requests across multiple languages to streamline data flows.
- **Smart Popup Evasion:** Implements heuristic element-scoring and keyword matching to automatically bypass intrusive post-navigation popups.
- **Built-in Offline OCR:** Local image-to-text recognition for circumventing canvas-based or non-standard text rendering without relying on cloud APIs.
- **Secure Notification Bus:** Built-in signed message delivery for enterprise IMs (Slack, Feishu/Lark), supporting dynamic message templating and robust failure notifications.
- **Visual Runtime Monitoring:** Generates real-time, task-specific concurrency charts with straightforward data export options (.csv / .txt).
- **Cron Scheduling:** Background task polling with isolated partition cookies for concurrent multi-account execution.
- **Local Data Privacy & Enterprise Security:** 100% local data persistence with OS-level encrypted storage for sensitive credentials, zero cloud sync, coupled with rigorous anti-tampering protection and strict license verification.

### 🚀 Installation 
**⚠️ Platform Version Notice:** Due to historical build configurations in the `v1.6.5` release branch, the provided versions differ by platform:
- **macOS Users:** You will receive the **Free Version** (All features set with no time limits).
- **Windows Users:** You will receive the **7-Day Trial Version** (All features set with time-limited).
*(Note: Full cross-platform parity for the Trial version will be introduced in the upcoming v2.0.0 milestone).*

Pre-built binaries for macOS and Windows are available in the [Releases](https://github.com/nexen33/ArgusRPA/releases) page.
- **macOS:** Download `Argus_Free_Setup_1.6.5_x64.dmg` & `Argus_Free_Setup_1.6.5_arm64.dmg`. 
- **Windows:** Download `Argus_Trial_Setup_1.6.5.exe`.

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
- **双轨可视化元素拾取:** 内置隔离沙盒浏览器，支持通过悬停实时解析页面结构。具备独立双快捷键拾取与“智能穿透”算法。点击/输入等操作支持物理 CDP 与代码 DOM 的无缝切换及降级兜底，并支持“重新选取”元素。
- **智能流程编排引擎:** 提供完整的自动化原语（条件分支、本地计算等）。支持“点击”前可选内容校验、动态替换 URL 中的动态标识符，且支持一键导入 Chrome DevTools Recorder 原生录制文件，大幅减轻手动配置压力。
- **智能网络请求拦截:** 动态捕获网络响应，结合可视化图标显示，智能过滤并拦截多语种的常见无关请求，净化运行环境。
- **启发式弹窗规避:** 采用元素面积计算与特征打分机制，静默检测并自动关闭登录后的各类强插屏干扰弹窗。
- **纯离线内置 OCR:** 无需连接云端，针对 Canvas 渲染或非标准文本执行纯本地的图像到文本识别提取。
- **高安全级消息总线与预警:** 原生集成 Slack 与飞书推送接口（内置加密签名鉴权），支持任务全面失败或状态失效时的精准消息预警推送。
- **可视化运行监控:** 为并发任务生成实时的可视化监控数据图表，并提供原生格式导出（.csv / .txt）。
- **后台调度与沙盒隔离:** 支持细粒度的定时轮询任务，且为每个批次任务分配独立的隔离环境，实现多账号并发免串签。
- **本地强隐私与企业级防护:** 运行数据及核心凭证采取系统级最高加密标准全量落地本地，零云端上传；底层引入深度代码防篡改与强授权校验机制。

### 🚀 下载与安装 
**⚠️ 平台版本差异说明：** 受限于 `v1.6.5` 历史分支的构建配置，当前双端提供的授权版本有所不同：
- **macOS 用户：** 下载的将是 **Free 免费版**（包含所有功能，无时间限制）。
- **Windows 用户：** 下载的将是 **7天 Trial 试用版**（包含所有功能，到期后需额外获取授权）。
*（注：全平台统一的 Trial 版本将在未来的 v2.0.0 里程碑中正式发布）。*

请前往 [Releases](https://github.com/nexen33/ArgusRPA/releases) 页面获取编译好的安装包：
- **macOS:** 下载 `Argus_Free_Setup_1.6.5_x64.dmg` 或 `Argus_Free_Setup_1.6.5_arm64.dmg`。
- **Windows:** 下载 `Argus_Trial_Setup_1.6.5.exe`。

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
