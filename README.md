<h1 align="center">Argus RPA</h1>

---

### 🔑 Unlock Pro Version / 获取完整授权<br/>
Loving the 7-day trial? Support the solo dev and grab a key to keep using the Pro version!<br/>
如果您觉得对应 Trial 的 7天试用版 好用的话，欢迎支持独立开发者，继续获取授权密钥以继续使用 Pro 版本！

<div align="center">
  <!-- Buy Me a Coffee (Global Users) -->
  <a href="https://buymeacoffee.com/tunpama/extras" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 144px !important;"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <!-- Afdian (Mainland China Users) -->
  <a href="https://ifdian.net/a/argus" target="_blank"><img src="https://pic1.afdiancdn.com/static/img/welcome/button-sponsorme.png" alt="去爱发电赞助" style="height: 40px !important;width: 144px !important;"></a>
</div>

<br/>

> ⚠️ **IMPORTANT / 购买须知**：<br/>
> License keys are bound to your hardware ID. Please leave your **[Hardware ID]** in the checkout notes. Keys will be delivered manually via Direct Message / Email within 24 hours.<br/>
> 授权密钥与您的机器码绑定。付款时请务必在订单备注中留下您的 **[机器码]**。您会在 24 小时内通过提供的可用渠道收到您的专属密钥。

---

*[🇨🇳 简体中文 (Simplified Chinese) 请向下滚动浏览]*

---

Argus is a lightweight, visually-driven Robotic Process Automation (RPA) tool and web scraper. Designed with a local-first architecture, it enables automated data extraction and workflow execution without requiring complex scripting. 

### 🛠️ Architecture Notice
The UI rendering layer is built with **React 18 + TailwindCSS + Vite**, while the core relies on **Electron** for cross-platform orchestration.<br>
*(Note: To protect core intellectual property, this repository exclusively open-sources the UI architecture and IPC communication skeleton. All underlying proprietary logic—including the dual Web/Desktop execution engines, anti-fingerprint sandbox, and smart routing algorithms—has been physically isolated. To experience the full capabilities, please use the provided binaries.)*

### ✨ Core Features
- **Comprehensive Web Automation(Core):** A highly mature web automation foundation supporting an extensive array of interaction primitives (e.g., condition branching, local file operations, element actions). Capable of bypassing DOM restrictions via "Network Variable Requests" to fetch API data directly, coupled with dynamic UUID/Token runtime replacement and smart network request interception.
- **Native Desktop Automation (Supplementary - Windows Beta):** Powered by a zero-dependency local execution runner. Employs a highly reliable dual-picking mechanism combining intelligent image recognition with native UI Automation, providing robust interactions with desktop applications. *(Note: macOS desktop support is currently in development).*
- **Deep Enterprise IM Integration:** Features a robust WebSocket-based bot communication layer seamlessly integrated with Feishu (including Lark) and Slack. Supports one-click alert script generation, self-healing state management, concurrent alerting pipelines, and dynamic Markdown templating.
- **High-Performance Task Isolation & Gateway:** Powered by a dynamic local API port allocator and robust data validation gateway. Employs high-speed local disk exchange for tasks and true process reuse via a singleton daemon to completely eliminate bottlenecks during mass concurrency.
- **Visual Element Picker with Fallback:** Built-in isolated browser environment supporting dynamic element inspection. Equipped with independent dual-shortcut picking and a unified smart penetration algorithm offering automatic fallback mechanisms, ensuring absolute stability during runtime UI shifts.
- **Node-based Workflow Engine:** Supports sequenced automation logic including pre-click content validation. Greatly reduces manual configuration through one-click import capabilities for Chrome DevTools Recorder files.
- **Smart Popup Evasion:** Implements heuristic element-scoring and keyword matching to automatically bypass intrusive post-navigation popups.
- **Built-in Offline OCR:** Local image-to-text recognition for circumventing canvas-based or non-standard text rendering without relying on cloud APIs.
- **Visual Runtime Monitoring:** Generates real-time, task-specific concurrency charts with straightforward data export options (.csv / .txt).
- **Cron Scheduling:** Background task polling with isolated partition cookies for concurrent multi-account execution.
- **Local Data Privacy & Enterprise Security:** 100% local data persistence with OS-level encrypted storage for sensitive credentials, zero cloud sync, coupled with rigorous anti-tampering protection and strict license verification.

### 🚀 Installation 
**⚠️ Trial Policy Notice:** To ensure sustainable development and maintain infrastructure, all downloads are provided as a fully unlocked **7-Day Trial Version**. Once the trial period expires, the application will automatically transition into the **Pro Version** state, at which point an authorization key will be required to continue executing workflows. (You can buy an license key from the support buttons at the beginning)

Pre-built binaries for macOS and Windows are available in the [Releases](https://github.com/nexen33/ArgusRPA/releases) page.
- **macOS:** Download `Argus_Trial_Setup_2.0.0_x64.dmg` & `Argus_Trial_Setup_2.0.0_arm64.dmg`. 
- **Windows:** Download `Argus_Trial_Setup_2.0.0.exe`.

### ⚠️ Disclaimer
Argus is provided "as-is" for educational and personal workflow automation purposes only. The user assumes all responsibility for adhering to the Terms of Service and `robots.txt` policies of the target websites. The author holds no liability for any misuse, account suspension, or legal disputes arising from the use of this software.

---

# 🇨🇳 简体中文介绍

<h1 align="center">Argus RPA</h1>

Argus 是一款轻量级、视觉驱动的 桌面级 RPA 与 网页数据 提取工具。项目采用完全本地化的架构设计，无需编写复杂脚本即可实现自动化的工作流调度。

### 🛠️ 架构说明
本项目的 UI 渲染层采用了 **React 18 + TailwindCSS + Vite** 构建，底层基于 **Electron** 实现跨平台调度。<br>
*(注：为保护核心知识产权与商业逻辑，本仓库目前仅开源 UI 渲染架构与 IPC 通信骨架。包含 Web/Desktop 双轨执行引擎、防指纹沙盒及智能调度算法在内的所有核心底层源码均已进行物理隔离。如需体验完整自动化能力，请使用上方提供的安装包。)*

### ✨ 核心功能
- **全能型网页自动化 (核心):** 拥有极度成熟的 Web 自动化底座，全面支持超过二十余种自动化原语（包含条件分支、本地文件流处理、模拟交互等）。支持突破常规 DOM 限制，新增通过“网络变量请求”直取底层接口数据，并具备智能网络响应拦截与运行时 Token 动态替换能力。
- **桌面自动化 (辅助延伸 - Windows Beta):** 搭载纯本地零依赖的执行核心，通过智能图像识别与系统原生控件（UIA）的双轨拾取机制，实现高可用性的桌面应用自动化流转。*(注：macOS 桌面端底层目前仍在研发适配中)*。
- **企业级协同 IM 深度绑定:** 内置高性能 WebSocket 机器人通讯底座，完美集成飞书 (包括Lark) 与 Slack。原生支持一键生成自动化推送脚本、底层状态破损自愈、多路并发告警拦截以及灵活的 Markdown 模板注入机制。
- **高性能任务调度与数据网关:** 具备本地 API 端口动态分配能力与强大的安全数据网关；桌面级任务完全采用高速本地磁盘数据交换与守护进程“真复用”机制，彻底解决海量多任务并发时的性能瓶颈。
- **双轨可视化元素拾取:** 内置隔离沙盒浏览器，支持通过悬停实时解析页面结构。搭载独立双快捷键拾取与“智能穿透”算法，点击与输入操作无缝支持底层驱动与页面代码级的降级兜底，应对极端页面重绘场景游刃有余。
- **智能流程编排引擎:** 提供完整的逻辑闭环（包括执行前内容校验），并支持一键导入浏览器原生录制文件，极大程度降低用户的手工配置成本。
- **启发式弹窗规避:** 采用元素面积计算与特征打分机制，静默检测并自动关闭登录后的各类强插屏干扰弹窗。
- **纯离线内置 OCR:** 无需连接云端，针对 Canvas 渲染或非标准文本执行纯本地的图像到文本识别提取。
- **可视化运行监控:** 为并发任务生成实时的可视化监控数据图表，并提供原生格式导出（.csv / .txt）。
- **后台调度与沙盒隔离:** 支持细粒度的定时轮询任务，且为每个批次任务分配独立的隔离环境，实现多账号并发免串签。
- **本地强隐私与企业级防护:** 运行数据及核心凭证采取系统级最高加密标准全量落地本地，零云端上传；底层融合了深度代码防篡改与强授权校验机制。

### 🚀 下载与安装 
**⚠️ 试用政策说明：** 为了维持本项目的长久研发与底层运维，当前提供的所有安装包均为全功能解锁的 **7 天 Trial 试用版**。当试用期结束后，软件会自动平滑过渡至 **Pro 专业版** 锁定状态，届时将需要持有有效的授权密钥方可继续执行您的自动化流转任务。感谢您对独立开发者的理解。（授权密钥可以从开头的支持链接处获取）

请前往 [Releases](https://github.com/nexen33/ArgusRPA/releases) 页面获取编译好的安装包：
- **macOS:** 下载 `Argus_Trial_Setup_2.0.0_x64.dmg` 或 `Argus_Trial_Setup_2.0.0_arm64.dmg`。
- **Windows:** 下载 `Argus_Trial_Setup_2.0.0.exe`。

### ⚠️ 免责声明 (Disclaimer)
本软件按“原样”提供，仅供个人学习、技术研究及合法的工作流自动化使用。用户在使用本软件时，必须严格遵守目标网站的《服务条款》(ToS) 及 `robots.txt` 爬虫协议。因滥用本软件（包括但不限于高频抓取、逆向破解等）导致的目标网站服务异常、账号封禁或任何相关法律纠纷，软件开发者不承担任何直接或连带法律责任。

---

<p align="center">
  <!-- 这里放你刚生成的新图片链接 -->
  <img width="7550" height="2160" alt="Image" src="https://github.com/user-attachments/assets/612142cc-2109-47d1-8560-5571ecea7286" />
</p>

<p align="center">
  <img width="7550" height="2160" alt="Image" src="https://github.com/user-attachments/assets/af46f871-6df4-4b43-b1b4-863f9b6dce31" />
</p>


<p align="center">
  <em>Viel Spaß damit!</em><br />
  <em>Entwickelt mit ❤️ von Tun&PaMa Familie</em><br />
  <em>Copyright © 2026 Tun & PaMa AG</em>
</p>
